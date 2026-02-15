import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { uploadFile, isSpacesConfigured, getSignedFileUrl } from '@/lib/spaces'
import { v4 as uuidv4 } from 'uuid'

interface Params {
  params: {
    leadId: string
  }
}

// GET /api/leads/[leadId]/archivos - Obtener archivos del lead
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''

    // Verificar que el lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    // Construir filtros
    let whereClause: any = { leadId: params.leadId }

    if (search) {
      whereClause.nombreOriginal = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (type) {
      whereClause.tipoMime = {
        contains: type,
        mode: 'insensitive'
      }
    }

    const archivos = await prisma.archivo.findMany({
      where: whereClause,
      include: {
        subidoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fechaSubida: 'desc'
      }
    })

    // Generar URLs firmadas para cada archivo
    const archivosConUrls = await Promise.all(
      archivos.map(async (archivo) => {
        try {
          // Usar rutaArchivo (que contiene el key) para generar URL firmada
          const signedUrl = await getSignedFileUrl(archivo.rutaArchivo, 3600) // 1 hora de expiración
          return {
            ...archivo,
            url: signedUrl
          }
        } catch (error) {
          console.error(`Error generando URL firmada para archivo ${archivo.id}:`, error)
          // En caso de error, mantener la URL original como fallback
          return archivo
        }
      })
    )

    return NextResponse.json({ archivos: archivosConUrls })
  } catch (error: any) {
    console.error('Error al obtener archivos:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/leads/[leadId]/archivos - Subir archivo
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.LEADS.EDIT)

    // Verificar configuración de Spaces
    if (!isSpacesConfigured()) {
      return NextResponse.json(
        { error: 'Configuración de almacenamiento no disponible' },
        { status: 500 }
      )
    }

    // Verificar que el lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    // Parsear FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validar tamaño (10MB máximo)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: 'El archivo excede el tamaño máximo de 10MB' 
      }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no permitido' 
      }, { status: 400 })
    }

    // Generar nombres únicos
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    const folderPath = `leads/${params.leadId}/archivos`
    const fullPath = `${folderPath}/${uniqueFileName}`

    try {
      // Subir archivo a DigitalOcean Spaces
      const uploadResult = await uploadFile({
        file,
        key: fullPath,
        contentType: file.type
      })

      // Guardar información en la base de datos
      const archivo = await prisma.archivo.create({
        data: {
          nombreOriginal: file.name,
          nombreArchivo: uniqueFileName,
          rutaArchivo: fullPath,
          tamano: file.size,
          tipoMime: file.type,
          url: uploadResult.url,
          leadId: params.leadId,
          subidoPorId: session.user.id
        },
        include: {
          subidoPor: {
            select: {
              id: true,
              nombre: true,
              apellido: true
            }
          }
        }
      })

      return NextResponse.json({ archivo }, { status: 201 })

    } catch (uploadError) {
      console.error('Error al subir archivo:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir el archivo al almacenamiento' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Error en POST archivos:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
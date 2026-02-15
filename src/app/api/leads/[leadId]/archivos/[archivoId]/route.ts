import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { deleteFile, getSignedFileUrl } from '@/lib/spaces'

interface Params {
  params: {
    leadId: string
    archivoId: string
  }
}

// GET /api/leads/[leadId]/archivos/[archivoId] - Obtener URL firmada del archivo
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.LEADS.VIEW)

    // Verificar que el archivo existe y pertenece al lead
    const archivo = await prisma.archivo.findFirst({
      where: {
        id: params.archivoId,
        leadId: params.leadId
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

    if (!archivo) {
      return NextResponse.json({ 
        error: 'Archivo no encontrado' 
      }, { status: 404 })
    }

    try {
      // Generar URL firmada con 1 hora de expiración
      const signedUrl = await getSignedFileUrl(archivo.rutaArchivo, 3600)
      
      return NextResponse.json({ 
        ...archivo,
        url: signedUrl
      })

    } catch (signError) {
      console.error('Error generando URL firmada:', signError)
      return NextResponse.json(
        { error: 'Error al generar URL de acceso al archivo' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Error al obtener archivo:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/leads/[leadId]/archivos/[archivoId] - Eliminar archivo
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.LEADS.EDIT)

    // Verificar que el archivo existe y pertenece al lead
    const archivo = await prisma.archivo.findFirst({
      where: {
        id: params.archivoId,
        leadId: params.leadId
      }
    })

    if (!archivo) {
      return NextResponse.json({ 
        error: 'Archivo no encontrado' 
      }, { status: 404 })
    }

    try {
      // Eliminar archivo de DigitalOcean Spaces
      await deleteFile(archivo.rutaArchivo)
      
      // Eliminar de la base de datos
      await prisma.archivo.delete({
        where: { id: params.archivoId }
      })

      return NextResponse.json({ 
        message: 'Archivo eliminado exitosamente' 
      })

    } catch (deleteError) {
      console.error('Error al eliminar archivo del storage:', deleteError)
      
      // Si falla el borrado del storage pero el archivo existe en BD, 
      // aún eliminamos de BD para mantener consistencia
      await prisma.archivo.delete({
        where: { id: params.archivoId }
      })

      return NextResponse.json({ 
        message: 'Archivo eliminado de la base de datos. Error al eliminar del almacenamiento.' 
      })
    }

  } catch (error: any) {
    console.error('Error al eliminar archivo:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
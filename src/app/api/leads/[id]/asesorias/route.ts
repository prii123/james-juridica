import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.LEADS.VIEW)

    // Obtener el lead para verificar que existe y obtener su nombre
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      select: { 
        id: true, 
        nombre: true 
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    // Obtener las asesorías del lead
    const asesorias = await prisma.asesoria.findMany({
      where: { leadId: params.id },
      include: {
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    return NextResponse.json({
      leadName: lead.nombre,
      asesorias: asesorias
    })
  } catch (error: any) {
    console.error('Error al obtener asesorías:', error)
    return NextResponse.json(
      { error: 'Error al cargar las asesorías' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.ASESORIAS.CREATE)

    const body = await request.json()
    
    // Verificar que el lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: params.id }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    // Crear la asesoría
    const asesoria = await prisma.asesoria.create({
      data: {
        ...body,
        leadId: params.id
      },
      include: {
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        lead: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    return NextResponse.json(asesoria, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear asesoría:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear la asesoría' },
      { status: 400 }
    )
  }
}
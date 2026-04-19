import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prepareAudienciaForSync, syncEventToGoogleCalendar } from '@/lib/google-calendar'

// GET /api/casos/[casoId]/audiencias - Obtener todas las audiencias de un caso
export async function GET(
  request: NextRequest,
  { params }: { params: { casoId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.CASOS.VIEW)

    const audiencias = await prisma.audiencia.findMany({
      where: {
        casoId: params.casoId
      },
      include: {
        responsable: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      },
      orderBy: {
        fechaHora: 'asc'
      }
    })

    // Transformar fechaHora a fechaAudiencia y horaInicio para el frontend
    const audienciasTransformadas = audiencias.map(audiencia => {
      const fechaHora = new Date(audiencia.fechaHora)
      return {
        id: audiencia.id,
        tipo: audiencia.tipo,
        titulo: `Audiencia de ${audiencia.tipo}`,
        fechaAudiencia: fechaHora.toISOString().split('T')[0],
        horaInicio: fechaHora.toTimeString().substring(0, 5),
        estado: audiencia.estado,
        modalidad: audiencia.modalidad,
        lugar: audiencia.direccion,
        enlaceVirtual: audiencia.enlace,
        observaciones: audiencia.observaciones,
        responsable: audiencia.responsable
      }
    })

    return NextResponse.json(audienciasTransformadas)
  } catch (error: any) {
    console.error('Error al obtener audiencias:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

// POST /api/casos/[casoId]/audiencias - Crear nueva audiencia
export async function POST(
  request: NextRequest,
  { params }: { params: { casoId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.CASOS.CREATE)

    const body = await request.json()
    const user = await getCurrentUser()

    // Validar que el caso existe
    const caso = await prisma.caso.findUnique({
      where: { id: params.casoId }
    })

    if (!caso) {
      return NextResponse.json(
        { error: 'Caso no encontrado' },
        { status: 404 }
      )
    }

    // Combinar fecha y hora
    const fechaHora = new Date(`${body.fechaAudiencia}T${body.horaInicio}:00`)

    // Crear la audiencia
    const audiencia = await prisma.audiencia.create({
      data: {
        tipo: body.tipo,
        fechaHora: fechaHora,
        estado: body.estado || 'PROGRAMADA',
        modalidad: body.modalidad,
        direccion: body.lugar || null,
        enlace: body.enlaceVirtual || null,
        observaciones: body.observaciones || null,
        resultado: null,
        casoId: params.casoId,
        responsableId: body.responsableId || user?.id || caso.responsableId
      },
      include: {
        responsable: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    })

    // Sincronizar con Google Calendar automáticamente
    try {
      const eventData = await prepareAudienciaForSync(audiencia.id);
      if (eventData) {
        await syncEventToGoogleCalendar(eventData);
      }
    } catch (syncError) {
      console.error('Error syncing audiencia to Google Calendar:', syncError);
      // No fallar la creación si la sincronización falla
    }

    return NextResponse.json(audiencia, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear audiencia:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

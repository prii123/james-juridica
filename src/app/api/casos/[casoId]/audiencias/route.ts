import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { AudienciasService } from '@/modules/audiencias/services'

const audienciasService = new AudienciasService()

export async function GET(
    request: NextRequest,
    { params }: { params: { casoId: string } }
) {
    try {
        await requirePermission(PERMISSIONS.AUDIENCIAS.VIEW)

        const audiencias = await audienciasService.getAudienciasByCaso(params.casoId)

        return NextResponse.json(audiencias)
    } catch (error: any) {
        console.error('Error al obtener audiencias:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { casoId: string } }
) {
    try {
        await requirePermission(PERMISSIONS.AUDIENCIAS.CREATE)

        const body = await request.json()
        const audiencia = await audienciasService.createAudiencia({
            ...body,
            casoId: params.casoId
        })

        return NextResponse.json(audiencia)
    } catch (error: any) {
        console.error('Error al crear audiencia:', error)

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Datos inválidos', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

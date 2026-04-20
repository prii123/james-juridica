import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { AudienciasService } from '@/modules/audiencias/services'

const audienciasService = new AudienciasService()

export async function GET(
    request: NextRequest,
    { params }: { params: { casoId: string; audienciaId: string } }
) {
    try {
        await requirePermission(PERMISSIONS.AUDIENCIAS.VIEW)

        const audiencia = await audienciasService.getAudienciaById(params.audienciaId)

        if (!audiencia) {
            return NextResponse.json(
                { error: 'Audiencia no encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json(audiencia)
    } catch (error: any) {
        console.error('Error al obtener audiencia:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { casoId: string; audienciaId: string } }
) {
    try {
        await requirePermission(PERMISSIONS.AUDIENCIAS.EDIT)

        const body = await request.json()
        const audiencia = await audienciasService.updateAudiencia(
            params.audienciaId,
            body
        )

        return NextResponse.json(audiencia)
    } catch (error: any) {
        console.error('Error al actualizar audiencia:', error)

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

export async function DELETE(
    request: NextRequest,
    { params }: { params: { casoId: string; audienciaId: string } }
) {
    try {
        await requirePermission(PERMISSIONS.AUDIENCIAS.DELETE)

        await audienciasService.deleteAudiencia(params.audienciaId)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error al eliminar audiencia:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}




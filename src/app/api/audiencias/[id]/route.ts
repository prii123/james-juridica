import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { AudienciasService } from '@/modules/audiencias/services'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requirePermission(PERMISSIONS.CASOS.VIEW)

        const audienciasService = new AudienciasService()
        const result = await audienciasService.getAudienciaById(params.id)

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Error al obtener audiencia:', error)
        return NextResponse.json(
            { error: error.message },
            { status: error.message.includes('no encontrada') ? 404 : 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requirePermission(PERMISSIONS.CASOS.EDIT)

        const body = await request.json()

        const audienciasService = new AudienciasService()
        const result = await audienciasService.updateAudiencia(params.id, body)

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Error al actualizar audiencia:', error)
        return NextResponse.json(
            { error: error.message },
            { status: error.message.includes('no encontrada') ? 404 : 400 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requirePermission(PERMISSIONS.CASOS.EDIT)

        const audienciasService = new AudienciasService()
        const result = await audienciasService.deleteAudiencia(params.id)

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Error al eliminar audiencia:', error)
        return NextResponse.json(
            { error: error.message },
            { status: error.message.includes('no encontrada') ? 404 : 400 }
        )
    }
}

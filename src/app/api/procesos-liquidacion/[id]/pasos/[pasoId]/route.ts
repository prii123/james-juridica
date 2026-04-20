import { NextRequest, NextResponse } from 'next/server'
import { ProcesosLiquidacionService } from '@/modules/procesos-liquidacion'

const service = new ProcesosLiquidacionService()

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; pasoId: string } }
) {
    try {
        const { id, pasoId } = params
        const body = await request.json()
        const { completado } = body

        if (typeof completado !== 'boolean') {
            return NextResponse.json(
                { error: 'completado debe ser un booleano' },
                { status: 400 }
            )
        }

        const proceso = await service.updatePasoLiquidacion(id, pasoId, completado)

        return NextResponse.json(proceso)
    } catch (error: any) {
        console.error('Error al actualizar paso de liquidación:', error)
        return NextResponse.json(
            { error: error.message || 'Error al actualizar paso de liquidación' },
            { status: 400 }
        )
    }
}

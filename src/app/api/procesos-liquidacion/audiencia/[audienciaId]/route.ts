import { NextRequest, NextResponse } from 'next/server'
import { ProcesosLiquidacionService } from '@/modules/procesos-liquidacion'

const service = new ProcesosLiquidacionService()

export async function GET(
    request: NextRequest,
    { params }: { params: { audienciaId: string } }
) {
    try {
        const { audienciaId } = params

        const proceso = await service.getProcesoLiquidacionByAudiencia(audienciaId)

        return NextResponse.json(proceso)
    } catch (error: any) {
        console.error('Error al obtener proceso de liquidación por audiencia:', error)
        return NextResponse.json(
            { error: error.message || 'Error al obtener proceso de liquidación' },
            { status: 400 }
        )
    }
}

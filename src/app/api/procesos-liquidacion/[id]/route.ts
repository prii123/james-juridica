import { NextRequest, NextResponse } from 'next/server'
import { ProcesosLiquidacionService } from '@/modules/procesos-liquidacion'

const service = new ProcesosLiquidacionService()

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        const proceso = await service.getProcesoLiquidacionById(id)

        return NextResponse.json(proceso)
    } catch (error: any) {
        console.error('Error al obtener proceso de liquidación:', error)
        return NextResponse.json(
            { error: error.message || 'Error al obtener proceso de liquidación' },
            { status: 400 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await request.json()

        const proceso = await service.updateProcesoLiquidacion(id, body)

        return NextResponse.json(proceso)
    } catch (error: any) {
        console.error('Error al actualizar proceso de liquidación:', error)
        return NextResponse.json(
            { error: error.message || 'Error al actualizar proceso de liquidación' },
            { status: 400 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        const proceso = await service.deleteProcesoLiquidacion(id)

        return NextResponse.json(proceso)
    } catch (error: any) {
        console.error('Error al eliminar proceso de liquidación:', error)
        return NextResponse.json(
            { error: error.message || 'Error al eliminar proceso de liquidación' },
            { status: 400 }
        )
    }
}

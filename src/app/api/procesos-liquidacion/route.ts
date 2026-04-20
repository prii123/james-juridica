import { NextRequest, NextResponse } from 'next/server'
import { ProcesosLiquidacionService } from '@/modules/procesos-liquidacion'

const service = new ProcesosLiquidacionService()

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Crear el proceso de liquidación
        const proceso = await service.createProcesoLiquidacion(body)

        return NextResponse.json(proceso, { status: 201 })
    } catch (error: any) {
        console.error('Error al crear proceso de liquidación:', error)

        // Diferenciar entre error de validación y otros errores
        if (error.message?.includes('Ya existe un proceso de liquidación')) {
            return NextResponse.json(
                { error: error.message },
                { status: 409 } // Conflict
            )
        }

        return NextResponse.json(
            { error: error.message || 'Error al crear proceso de liquidación' },
            { status: 400 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const casoId = searchParams.get('casoId')

        if (!casoId) {
            return NextResponse.json(
                { error: 'casoId es requerido' },
                { status: 400 }
            )
        }

        const procesos = await service.getProcesosLiquidacionByCaso(casoId)

        return NextResponse.json(procesos)
    } catch (error: any) {
        console.error('Error al obtener procesos de liquidación:', error)
        return NextResponse.json(
            { error: error.message || 'Error al obtener procesos de liquidación' },
            { status: 400 }
        )
    }
}

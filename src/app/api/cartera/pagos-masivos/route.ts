import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { CarteraService } from '@/modules/cartera/services'

export const dynamic = 'force-dynamic'

const MAX_FILAS = 1000

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    await requirePermission(PERMISSIONS.CARTERA.MANAGE)

    const { pagos } = await request.json()
    if (!Array.isArray(pagos) || pagos.length === 0) {
      return NextResponse.json({ error: 'No se recibieron pagos para registrar' }, { status: 400 })
    }
    if (pagos.length > MAX_FILAS) {
      return NextResponse.json({ error: `Máximo ${MAX_FILAS} pagos por carga` }, { status: 400 })
    }

    const resultado = await new CarteraService().pagosMasivos(pagos)
    return NextResponse.json(resultado)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

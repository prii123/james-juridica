import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { FacturacionService } from '@/modules/facturacion/services'

export const dynamic = 'force-dynamic'

const MAX_FILAS = 500

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    await requirePermission(PERMISSIONS.FACTURACION.CREATE)

    const { facturas } = await request.json()
    if (!Array.isArray(facturas) || facturas.length === 0) {
      return NextResponse.json({ error: 'No se recibieron facturas para crear' }, { status: 400 })
    }
    if (facturas.length > MAX_FILAS) {
      return NextResponse.json({ error: `Máximo ${MAX_FILAS} filas por carga` }, { status: 400 })
    }

    const resultado = await new FacturacionService().crearMasivo(facturas, session.user.id)
    return NextResponse.json(resultado)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

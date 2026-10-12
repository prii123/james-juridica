import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { ClientesService } from '@/modules/clientes/services'

export const dynamic = 'force-dynamic'

const MAX_FILAS = 1000

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CLIENTES.CREATE)
    const { clientes } = await request.json()
    if (!Array.isArray(clientes) || clientes.length === 0) {
      return NextResponse.json({ error: 'No se recibieron clientes para crear' }, { status: 400 })
    }
    if (clientes.length > MAX_FILAS) {
      return NextResponse.json({ error: `Máximo ${MAX_FILAS} clientes por carga` }, { status: 400 })
    }
    const resultado = await new ClientesService().crearMasivo(clientes)
    return NextResponse.json(resultado)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

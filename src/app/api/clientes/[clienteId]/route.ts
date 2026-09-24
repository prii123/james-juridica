import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { ClientesService } from '@/modules/clientes/services'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { clienteId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.CLIENTES.VIEW)

    const clientesService = new ClientesService()
    const cliente = await clientesService.obtenerPorId(params.clienteId)

    return NextResponse.json(cliente)
  } catch (error: any) {
    const status = error.message === 'Cliente no encontrado' ? 404 : 400
    return NextResponse.json({ error: error.message }, { status })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clienteId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.CLIENTES.EDIT)

    const body = await request.json()
    const clientesService = new ClientesService()
    const cliente = await clientesService.actualizar(params.clienteId, body)

    return NextResponse.json(cliente)
  } catch (error: any) {
    const status = error.message === 'Cliente no encontrado' ? 404 : 400
    return NextResponse.json({ error: error.message }, { status })
  }
}

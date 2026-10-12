import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { ClientesService } from '@/modules/clientes/services'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CLIENTES.CREATE)
    const body = await request.json()
    const cliente = await new ClientesService().crear(body)
    return NextResponse.json(cliente, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

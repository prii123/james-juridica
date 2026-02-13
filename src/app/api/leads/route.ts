import { NextRequest, NextResponse } from 'next/server'
import { LeadsService } from '@/modules/leads/services'
import { getCurrentUser, requirePermission, PERMISSIONS } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const estado = searchParams.get('estado')
    const tipoPersona = searchParams.get('tipoPersona')
    const responsableId = searchParams.get('responsableId')
    const search = searchParams.get('search')

    const filters: any = {}
    if (estado) filters.estado = estado
    if (tipoPersona) filters.tipoPersona = tipoPersona
    if (responsableId) filters.responsableId = responsableId
    if (search) filters.search = search

    const leadsService = new LeadsService()
    const result = await leadsService.getLeads(filters, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.LEADS.CREATE)

    const body = await request.json()
    const user = await getCurrentUser()
    
    // Si no se especifica responsable, asignar al usuario actual
    if (!body.responsableId) {
      body.responsableId = user?.id
    }

    const leadsService = new LeadsService()
    const lead = await leadsService.createLead(body)

    return NextResponse.json(lead, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
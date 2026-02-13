import { NextRequest, NextResponse } from 'next/server'
import { LeadsService } from '@/modules/leads/services'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const leadsService = new LeadsService()
    const lead = await leadsService.getLeadById(params.id)

    return NextResponse.json(lead)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.LEADS.EDIT)

    const body = await request.json()
    const leadsService = new LeadsService()
    const lead = await leadsService.updateLead(params.id, body)

    return NextResponse.json(lead)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.LEADS.EDIT)

    const body = await request.json()
    const leadsService = new LeadsService()
    const lead = await leadsService.updateLead(params.id, body)

    return NextResponse.json(lead)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.LEADS.DELETE)

    const leadsService = new LeadsService()
    await leadsService.deleteLead(params.id)

    return NextResponse.json({ message: 'Lead eliminado exitosamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
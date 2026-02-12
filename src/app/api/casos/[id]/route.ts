import { NextRequest, NextResponse } from 'next/server'
import { CasosService } from '@/modules/casos/services'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.CASOS.VIEW)

    const casosService = new CasosService()
    const caso = await casosService.getCasoById(params.id)

    return NextResponse.json(caso)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.CASOS.EDIT)

    const body = await request.json()
    const casosService = new CasosService()
    const caso = await casosService.updateCaso(params.id, body)

    return NextResponse.json(caso)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.CASOS.DELETE)

    const casosService = new CasosService()
    await casosService.deleteCaso(params.id)

    return NextResponse.json({ message: 'Caso eliminado exitosamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
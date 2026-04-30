import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    const modules = await prisma.module.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })

    if (!session?.user?.id) {
      const publicModules = modules.filter(m => !m.permission)
      return NextResponse.json({ modules: publicModules })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ modules: modules.filter(m => !m.permission) })
    }

    const userPermissions = user.role.permissions.map(p => p.permission.nombre)
    const isAdmin = user.role.nombre === 'Administrador'

    const filtered = modules.filter(m =>
      !m.permission || isAdmin || userPermissions.includes(m.permission)
    )

    return NextResponse.json({ modules: filtered })
  } catch (error: any) {
    console.error('[API] Error fetching sidebar modules:', error)
    return NextResponse.json({ modules: [] })
  }
}

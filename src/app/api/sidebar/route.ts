import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DEFAULT_MODULES = [
  { name: 'Dashboard', href: '/dashboard', icon: 'Home', description: 'Vista general y métricas', permission: null, order: 1 },
  { name: 'Calendario', href: '/calendario', icon: 'Calendar', description: 'Eventos y agenda', permission: null, order: 2 },
  { name: 'Leads', href: '/leads', icon: 'Users', description: 'Potenciales clientes', permission: 'leads.view', order: 3 },
  { name: 'Asesorías', href: '/asesorias', icon: 'Scale', description: 'Consultas y asesorías jurídicas', permission: 'asesorias.view', order: 4 },
  { name: 'Radicaciones', href: '/radicaciones', icon: 'FileText', description: 'Procesos de radicación', permission: 'radicaciones.view', order: 5 },
  { name: 'Casos', href: '/casos', icon: 'Briefcase', description: 'Gestión de casos de insolvencia', permission: 'casos.view', order: 6 },
  { name: 'Facturación', href: '/facturacion', icon: 'BarChart3', description: 'Facturación y reportes financieros', permission: 'facturacion.view', order: 7 },
  { name: 'Cartera', href: '/cartera', icon: 'CreditCard', description: 'Gestión de cobros y pagos', permission: 'cartera.view', order: 8 },
  { name: 'Usuarios', href: '/usuarios', icon: 'Users', description: 'Gestión de usuarios y permisos', permission: 'usuarios.view', order: 9 },
]

async function ensureModulesSeeded() {
  const existing = await prisma.module.findFirst({
    where: { name: 'Dashboard' },
    select: { id: true },
  })

  if (!existing) {
    await prisma.module.createMany({
      data: DEFAULT_MODULES,
    })
    return
  }

  const total = await prisma.module.count()
  if (total > DEFAULT_MODULES.length) {
    const names = DEFAULT_MODULES.map((m) => m.href)
    const duplicates = await prisma.module.findMany({
      where: { href: { in: names } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, href: true, createdAt: true },
    })

    const seen = new Map<string, string>()
    const toDelete: string[] = []
    for (const mod of duplicates) {
      if (seen.has(mod.href)) {
        toDelete.push(mod.id)
      } else {
        seen.set(mod.href, mod.id)
      }
    }

    if (toDelete.length > 0) {
      await prisma.module.deleteMany({
        where: { id: { in: toDelete } },
      })
    }
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    await ensureModulesSeeded()

    const modules = await prisma.module.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })

    const noCacheHeaders = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }

    if (!session?.user?.id) {
      const publicModules = modules.filter(m => !m.permission)
      return NextResponse.json({ modules: publicModules }, { headers: noCacheHeaders })
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
      return NextResponse.json({ modules: modules.filter(m => !m.permission) }, { headers: noCacheHeaders })
    }

    const userPermissions = user.role.permissions.map(p => p.permission.nombre)
    const isAdmin = user.role.nombre === 'Administrador'

    const filtered = modules.filter(m =>
      !m.permission || isAdmin || userPermissions.includes(m.permission)
    )

    return NextResponse.json({ modules: filtered }, { headers: noCacheHeaders })
  } catch (error: any) {
    console.error('[API] Error fetching sidebar modules:', error)
    return NextResponse.json(
      { modules: [] },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } },
    )
  }
}

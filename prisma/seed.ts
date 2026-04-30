import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const modules = [
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

async function main() {
  console.log('Seeding modules...')

  await prisma.module.createMany({
    data: modules,
    skipDuplicates: true,
  })

  console.log('Modules seeded successfully')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

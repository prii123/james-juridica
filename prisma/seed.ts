import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear permisos
  const permissions = await Promise.all([
    // Permisos de Dashboard
    prisma.permission.create({
      data: {
        nombre: 'dashboard.view',
        descripcion: 'Ver dashboard principal',
        modulo: 'dashboard'
      }
    }),

    // Permisos de Leads
    prisma.permission.create({
      data: {
        nombre: 'leads.view',
        descripcion: 'Ver leads',
        modulo: 'leads'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'leads.create',
        descripcion: 'Crear leads',
        modulo: 'leads'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'leads.edit',
        descripcion: 'Editar leads',
        modulo: 'leads'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'leads.delete',
        descripcion: 'Eliminar leads',
        modulo: 'leads'
      }
    }),

    // Permisos de Seguimientos
    prisma.permission.create({
      data: {
        nombre: 'seguimientos.view',
        descripcion: 'Ver seguimientos',
        modulo: 'seguimientos'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'seguimientos.create',
        descripcion: 'Crear seguimientos',
        modulo: 'seguimientos'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'seguimientos.edit',
        descripcion: 'Editar seguimientos',
        modulo: 'seguimientos'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'seguimientos.delete',
        descripcion: 'Eliminar seguimientos',
        modulo: 'seguimientos'
      }
    }),

    // Permisos de Asesorías  
    prisma.permission.create({
      data: {
        nombre: 'asesorias.view',
        descripcion: 'Ver asesorías',
        modulo: 'asesorias'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'asesorias.create',
        descripcion: 'Crear asesorías',
        modulo: 'asesorias'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'asesorias.edit',
        descripcion: 'Editar asesorías',
        modulo: 'asesorias'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'asesorias.delete',
        descripcion: 'Eliminar asesorías',
        modulo: 'asesorias'
      }
    }),

    // Permisos de Radicaciones
    prisma.permission.create({
      data: {
        nombre: 'radicaciones.view',
        descripcion: 'Ver radicaciones',
        modulo: 'radicaciones'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'radicaciones.create',
        descripcion: 'Crear radicaciones',
        modulo: 'radicaciones'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'radicaciones.edit',
        descripcion: 'Editar radicaciones',
        modulo: 'radicaciones'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'radicaciones.delete',
        descripcion: 'Eliminar radicaciones',
        modulo: 'radicaciones'
      }
    }),

    // Permisos de Casos
    prisma.permission.create({
      data: {
        nombre: 'casos.view',
        descripcion: 'Ver casos',
        modulo: 'casos'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'casos.create',
        descripcion: 'Crear casos',
        modulo: 'casos'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'casos.edit',
        descripcion: 'Editar casos',
        modulo: 'casos'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'casos.delete',
        descripcion: 'Eliminar casos',
        modulo: 'casos'
      }
    }),

    // Permisos de Actuaciones
    prisma.permission.create({
      data: {
        nombre: 'actuaciones.view',
        descripcion: 'Ver actuaciones',
        modulo: 'actuaciones'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'actuaciones.create',
        descripcion: 'Crear actuaciones',
        modulo: 'actuaciones'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'actuaciones.edit',
        descripcion: 'Editar actuaciones',
        modulo: 'actuaciones'
      }
    }),

    // Permisos de Audiencias
    prisma.permission.create({
      data: {
        nombre: 'audiencias.view',
        descripcion: 'Ver audiencias',
        modulo: 'audiencias'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'audiencias.create',
        descripcion: 'Crear audiencias',
        modulo: 'audiencias'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'audiencias.edit',
        descripcion: 'Editar audiencias',
        modulo: 'audiencias'
      }
    }),

    // Permisos de Honorarios
    prisma.permission.create({
      data: {
        nombre: 'honorarios.view',
        descripcion: 'Ver honorarios',
        modulo: 'honorarios'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'honorarios.create',
        descripcion: 'Crear honorarios',
        modulo: 'honorarios'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'honorarios.edit',
        descripcion: 'Editar honorarios',
        modulo: 'honorarios'
      }
    }),

    // Permisos de Facturación
    prisma.permission.create({
      data: {
        nombre: 'facturacion.view',
        descripcion: 'Ver facturación',
        modulo: 'facturacion'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'facturacion.create',
        descripcion: 'Crear facturas',
        modulo: 'facturacion'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'facturacion.edit',
        descripcion: 'Editar facturas',
        modulo: 'facturacion'
      }
    }),

    // Permisos de Cartera
    prisma.permission.create({
      data: {
        nombre: 'cartera.view',
        descripcion: 'Ver cartera',
        modulo: 'cartera'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'cartera.manage',
        descripcion: 'Gestionar cartera',
        modulo: 'cartera'
      }
    }),

    // Permisos de Usuarios
    prisma.permission.create({
      data: {
        nombre: 'usuarios.view',
        descripcion: 'Ver usuarios',
        modulo: 'usuarios'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'usuarios.create',
        descripcion: 'Crear usuarios',
        modulo: 'usuarios'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'usuarios.edit',
        descripcion: 'Editar usuarios',
        modulo: 'usuarios'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'usuarios.delete',
        descripcion: 'Eliminar usuarios',
        modulo: 'usuarios'
      }
    }),
    prisma.permission.create({
      data: {
        nombre: 'roles.manage',
        descripcion: 'Gestionar roles y permisos',
        modulo: 'usuarios'
      }
    }),
  ])

  console.log(`✅ Creados ${permissions.length} permisos`)

  // Crear roles
  const adminRole = await prisma.role.create({
    data: {
      nombre: 'Administrador',
      descripcion: 'Acceso completo al sistema'
    }
  })

  const abogadoRole = await prisma.role.create({
    data: {
      nombre: 'Abogado',
      descripcion: 'Manejo de casos y procesos jurídicos'
    }
  })

  const asesorRole = await prisma.role.create({
    data: {
      nombre: 'Asesor',
      descripcion: 'Gestión de leads y asesorías'
    }
  })

  const auditorRole = await prisma.role.create({
    data: {
      nombre: 'Auditor',
      descripcion: 'Solo lectura de información'
    }
  })

  console.log('✅ Creados roles base')

  // Asignar todos los permisos al administrador
  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id
      }
    })
  }

  // Asignar permisos específicos al abogado
  const abogadoPermissions = permissions.filter(p => 
    p.nombre.includes('casos.') ||
    p.nombre.includes('actuaciones.') ||
    p.nombre.includes('audiencias.') ||
    p.nombre.includes('honorarios.') ||
    p.nombre.includes('radicaciones.') ||
    p.nombre.includes('seguimientos.') ||
    p.nombre === 'dashboard.view' ||
    p.nombre === 'asesorias.view' ||
    p.nombre === 'leads.view'
  )

  for (const permission of abogadoPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: abogadoRole.id,
        permissionId: permission.id
      }
    })
  }

  // Asignar permisos específicos al asesor
  const asesorPermissions = permissions.filter(p => 
    p.nombre.includes('leads.') ||
    p.nombre.includes('asesorias.') ||
    p.nombre.includes('seguimientos.') ||
    p.nombre === 'dashboard.view' ||
    p.nombre === 'casos.view'
  )

  for (const permission of asesorPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: asesorRole.id,
        permissionId: permission.id
      }
    })
  }

  // Asignar permisos de solo lectura al auditor
  const auditorPermissions = permissions.filter(p => p.nombre.endsWith('.view'))

  for (const permission of auditorPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: auditorRole.id,
        permissionId: permission.id
      }
    })
  }

  console.log('✅ Asignados permisos a roles')

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@juridica.com',
      password: hashedPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      documento: '0000000000',
      telefono: '3001234567',
      roleId: adminRole.id
    }
  })

  // Crear usuario admin con credenciales específicas (admin/admin12345678)
  const adminTestUser = await prisma.user.create({
    data: {
      email: 'admin',
      password: await bcrypt.hash('admin12345678', 12),
      nombre: 'Admin',
      apellido: 'Test',
      documento: '0000000001',
      telefono: '3001234568',
      roleId: adminRole.id
    }
  })

  // Crear algunos usuarios de prueba
  const abogadoUser = await prisma.user.create({
    data: {
      email: 'abogado@juridica.com',
      password: await bcrypt.hash('abogado123', 12),
      nombre: 'Juan Carlos',
      apellido: 'Pérez',
      documento: '1234567890',
      telefono: '3009876543',
      roleId: abogadoRole.id
    }
  })

  const asesorUser = await prisma.user.create({
    data: {
      email: 'asesor@juridica.com',
      password: await bcrypt.hash('asesor123', 12),
      nombre: 'María Elena',
      apellido: 'García',
      documento: '9876543210',
      telefono: '3001112233',
      roleId: asesorRole.id
    }
  })

  console.log('✅ Creados usuarios de prueba')

  // Crear algunos leads de ejemplo
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        nombre: 'Carlos Ramírez',
        email: 'carlos.ramirez@email.com',
        telefono: '3001234567',
        empresa: 'Comercial Los Andes S.A.S',
        tipoPersona: 'JURIDICA',
        documento: '9001234567',
        estado: 'NUEVO',
        origen: 'Sitio Web',
        observaciones: 'Empresa con problemas de insolvencia',
        responsableId: asesorUser.id
      }
    }),
    prisma.lead.create({
      data: {
        nombre: 'Ana María Rodríguez',
        email: 'ana.rodriguez@email.com',
        telefono: '3009876543',
        tipoPersona: 'NATURAL',
        documento: '1234567890',
        estado: 'CONTACTADO',
        origen: 'Referido',
        observaciones: 'Persona natural con deudas comerciales',
        responsableId: asesorUser.id
      }
    })
  ])

  console.log(`✅ Creados ${leads.length} leads de ejemplo`)

  // Crear algunos seguimientos de ejemplo
  await Promise.all([
    // Seguimientos para el primer lead (Carlos Ramírez)
    prisma.seguimiento.create({
      data: {
        tipo: 'LLAMADA',
        descripcion: 'Llamada inicial para presentar servicios de insolvencia',
        fecha: new Date('2024-02-10T10:30:00'),
        duracion: 15,
        resultado: 'Cliente interesado, solicita información detallada',
        proximoSeguimiento: new Date('2024-02-15T14:00:00'),
        leadId: leads[0].id,
        usuarioId: asesorUser.id
      }
    }),
    prisma.seguimiento.create({
      data: {
        tipo: 'EMAIL',
        descripcion: 'Envío de propuesta detallada y cronograma de proceso',
        fecha: new Date('2024-02-12T09:15:00'),
        resultado: 'Email enviado exitosamente con documentación',
        leadId: leads[0].id,
        usuarioId: asesorUser.id
      }
    }),
    prisma.seguimiento.create({
      data: {
        tipo: 'WHATSAPP',
        descripcion: 'Confirmación de recepción de documentos y dudas adicionales',
        fecha: new Date('2024-02-13T16:45:00'),
        resultado: 'Cliente confirma interés, programa asesoría',
        proximoSeguimiento: new Date('2024-02-20T10:00:00'),
        leadId: leads[0].id,
        usuarioId: asesorUser.id
      }
    }),

    // Seguimientos para el segundo lead (Ana María)
    prisma.seguimiento.create({
      data: {
        tipo: 'REUNION',
        descripcion: 'Primera reunión presencial para evaluar situación financiera',
        fecha: new Date('2024-02-11T15:00:00'),
        duracion: 45,
        resultado: 'Situación compleja, requiere análisis detallado',
        leadId: leads[1].id,
        usuarioId: abogadoUser.id
      }
    }),
    prisma.seguimiento.create({
      data: {
        tipo: 'NOTA',
        descripcion: 'Revisión de documentos financieros proporcionados',
        fecha: new Date('2024-02-13T11:30:00'),
        resultado: 'Documentación completa, procede a asesoría especializada',
        proximoSeguimiento: new Date('2024-02-18T09:00:00'),
        leadId: leads[1].id,
        usuarioId: abogadoUser.id
      }
    })
  ])

  console.log('✅ Creados seguimientos de ejemplo')

  // Crear algunas asesorías de ejemplo
  await prisma.asesoria.create({
    data: {
      tipo: 'INICIAL',
      estado: 'PROGRAMADA',
      fecha: new Date('2024-03-15T10:00:00'),
      duracion: 60,
      modalidad: 'PRESENCIAL',
      tema: 'Consulta sobre reorganización empresarial',
      descripcion: 'Primera asesoría para evaluar viabilidad de proceso de insolvencia',
      valor: 200000,
      leadId: leads[0].id,
      asesorId: abogadoUser.id
    }
  })

  console.log('✅ Creadas asesorías de ejemplo')

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
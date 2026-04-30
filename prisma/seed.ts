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

  // ==========================================
  // CLIENTES
  // ==========================================
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nombre: 'Luis Fernando',
        apellido: 'González Martínez',
        email: 'luis.gonzalez@email.com',
        telefono: '3101234567',
        documento: '1012345678',
        tipoPersona: 'NATURAL',
        direccion: 'Calle 45 # 23-12',
        ciudad: 'Bogotá',
        activo: true
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Inversiones del Valle',
        apellido: 'S.A.S.',
        email: 'contacto@inversionesvalle.com',
        telefono: '6023456789',
        documento: '900123456',
        tipoPersona: 'JURIDICA',
        empresa: 'Inversiones del Valle S.A.S.',
        direccion: 'Av. 6N # 15-20',
        ciudad: 'Cali',
        activo: true
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'María Victoria',
        apellido: 'Restrepo Londoño',
        email: 'maria.restrepo@email.com',
        telefono: '3159876543',
        documento: '1122334455',
        tipoPersona: 'NATURAL',
        direccion: 'Carrera 19 # 85-34',
        ciudad: 'Medellín',
        activo: true
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Constructora del Caribe',
        apellido: 'Ltda.',
        email: 'info@constructcaribe.com',
        telefono: '6051234567',
        documento: '800654321',
        tipoPersona: 'JURIDICA',
        empresa: 'Constructora del Caribe Ltda.',
        direccion: 'Av. San Martín # 8-50',
        ciudad: 'Barranquilla',
        activo: true
      }
    }),
  ])
  console.log(`✅ Creados ${clientes.length} clientes`)

  // ==========================================
  // CASOS
  // ==========================================
  const casos = await Promise.all([
    prisma.caso.create({
      data: {
        numeroCaso: 'REO-2025-001',
        tipoInsolvencia: 'REORGANIZACION',
        estado: 'ACTIVO',
        prioridad: 'ALTA',
        fechaInicio: new Date('2025-01-15'),
        observaciones: 'Proceso de reorganización empresarial para mejoras financieras',
        clienteId: clientes[1].id,
        responsableId: abogadoUser.id,
        creadoPorId: abogadoUser.id
      }
    }),
    prisma.caso.create({
      data: {
        numeroCaso: 'LIQ-2025-002',
        tipoInsolvencia: 'LIQUIDACION_JUDICIAL',
        estado: 'ACTIVO',
        prioridad: 'CRITICA',
        fechaInicio: new Date('2025-02-01'),
        observaciones: 'Liquidación judicial urgente por incumplimiento de acuerdos',
        clienteId: clientes[2].id,
        responsableId: abogadoUser.id,
        creadoPorId: abogadoUser.id
      }
    }),
    prisma.caso.create({
      data: {
        numeroCaso: 'IPN-2025-003',
        tipoInsolvencia: 'INSOLVENCIA_PERSONA_NATURAL',
        estado: 'ACTIVO',
        prioridad: 'MEDIA',
        fechaInicio: new Date('2025-03-10'),
        observaciones: 'Persona natural con deudas por $150.000.000',
        clienteId: clientes[0].id,
        responsableId: abogadoUser.id,
        creadoPorId: abogadoUser.id
      }
    }),
    prisma.caso.create({
      data: {
        numeroCaso: 'ARE-2025-004',
        tipoInsolvencia: 'ACUERDO_REORGANIZACION',
        estado: 'CERRADO',
        prioridad: 'BAJA',
        fechaInicio: new Date('2024-06-20'),
        fechaCierre: new Date('2025-01-30'),
        observaciones: 'Acuerdo de reorganización exitoso culminado',
        clienteId: clientes[3].id,
        responsableId: abogadoUser.id,
        creadoPorId: adminUser.id
      }
    }),
    prisma.caso.create({
      data: {
        numeroCaso: 'REO-2025-005',
        tipoInsolvencia: 'REORGANIZACION',
        estado: 'SUSPENDIDO',
        prioridad: 'MEDIA',
        fechaInicio: new Date('2025-01-05'),
        observaciones: 'Proceso suspendido por falta de documentación del cliente',
        clienteId: clientes[0].id,
        responsableId: abogadoUser.id,
        creadoPorId: abogadoUser.id
      }
    }),
  ])
  console.log(`✅ Creados ${casos.length} casos`)

  // ==========================================
  // ACTUACIONES
  // ==========================================
  const tiposActuacion = ['DERECHO_PETICION', 'LEVANTAMIENTO_EMBARGOS', 'RESPUESTA_REQUERIMIENTO', 'MEMORIAL', 'OTRO'] as const
  const estadosActuacion = ['PENDIENTE', 'EN_PROCESO', 'ENVIADA', 'RESPONDIDA', 'VENCIDA'] as const

  for (const caso of casos) {
    const numActuaciones = caso.estado === 'CERRADO' ? 4 : 3
    for (let i = 0; i < numActuaciones; i++) {
      await prisma.actuacion.create({
        data: {
          tipo: tiposActuacion[i % tiposActuacion.length],
          titulo: `Actuación ${i + 1} - ${tiposActuacion[i % tiposActuacion.length]}`,
          estado: i === 0 && caso.estado !== 'CERRADO' ? 'EN_PROCESO' : 'RESPONDIDA',
          descripcion: `Actuación ${i + 1} del caso ${caso.numeroCaso}`,
          fechaVencimiento: new Date(caso.fechaInicio.getTime() + (i + 2) * 7 * 24 * 60 * 60 * 1000),
          casoId: caso.id,
          responsableId: abogadoUser.id
        }
      })
    }
  }
  console.log('✅ Creadas actuaciones de ejemplo')

  // ==========================================
  // AUDIENCIAS
  // ==========================================
  const tiposAudiencia = ['RADICACION', 'ADMISORIA', 'VERIFICACION_CREDITOS', 'CATEGORIA_CREDITOS', 'CONCORDATO'] as const

  // Audiencias para el caso activo de reorganización (REO-2025-001)
  await Promise.all([
    prisma.audiencia.create({
      data: {
        tipo: 'RADICACION',
        estado: 'REALIZADA',
        modalidad: 'PRESENCIAL',
        resultadoAudiencia: 'CONCILIACION',
        fechaHora: new Date('2025-02-10T09:00:00'),
        resultado: 'Audiencia de radicación exitosa, se aceptó la solicitud',
        casoId: casos[0].id,
        responsableId: abogadoUser.id
      }
    }),
    prisma.audiencia.create({
      data: {
        tipo: 'ADMISORIA',
        estado: 'REALIZADA',
        modalidad: 'VIRTUAL',
        resultadoAudiencia: 'CONCILIACION',
        fechaHora: new Date('2025-03-05T10:30:00'),
        resultado: 'Audiencia admisoria virtual, se admitió la solicitud de reorganización',
        casoId: casos[0].id,
        responsableId: abogadoUser.id
      }
    }),
    prisma.audiencia.create({
      data: {
        tipo: 'VERIFICACION_CREDITOS',
        estado: 'REALIZADA',
        modalidad: 'VIRTUAL',
        resultadoAudiencia: 'PENDIENTE',
        fechaHora: new Date('2025-03-20T14:00:00'),
        resultado: 'Verificación de créditos presentados por los acreedores',
        casoId: casos[0].id,
        responsableId: abogadoUser.id
      }
    }),
  ])

  // Audiencia con FRACASO para el caso de liquidación (LIQ-2025-002)
  const audienciaFracaso = await prisma.audiencia.create({
    data: {
      tipo: 'CONCORDATO',
      estado: 'REALIZADA',
      modalidad: 'PRESENCIAL',
      resultadoAudiencia: 'FRACASO',
      fechaHora: new Date('2025-03-01T08:30:00'),
      resultado: 'Audiencia de concordato fallida, no se llegó a acuerdo con acreedores',
      casoId: casos[1].id,
      responsableId: abogadoUser.id
    }
  })

  // Audiencia programada para el caso IPN-2025-003
  await prisma.audiencia.create({
    data: {
      tipo: 'RADICACION',
      estado: 'PROGRAMADA',
      modalidad: 'MIXTA',
      resultadoAudiencia: 'PENDIENTE',
      fechaHora: new Date('2025-05-15T10:00:00'),
      resultado: 'Audiencia de radicación programada para inicio del proceso',
      casoId: casos[2].id,
      responsableId: abogadoUser.id
    }
  })
  console.log('✅ Creadas audiencias de ejemplo')

  // ==========================================
  // PROCESOS DE LIQUIDACIÓN (desde el FRACASO)
  // ==========================================
  await prisma.procesoLiquidacion.create({
    data: {
      audienciaId: audienciaFracaso.id,
      casoId: casos[1].id,
      pasos: [
        { id: 'autodeadmision', nombre: 'Autodeadmisión', completado: true, descripcion: 'Auto de Admisión de la insolvencia' },
        { id: 'nombrar-liquidador', nombre: 'Nombrar Liquidador', completado: true, descripcion: 'Nombrar al liquidador del proceso' },
        { id: 'inventario-avaluo', nombre: 'Inventario y Avalúo', completado: false, descripcion: 'Diligenciar inventario y avalúo de bienes' },
        { id: 'audiencia-adjudicacion', nombre: 'Audiencia y Adjudicación', completado: false, descripcion: 'Realizar audiencia y adjudicación de bienes' },
        { id: 'sentencia', nombre: 'Sentencia', completado: false, descripcion: 'Sentencia de liquidación' },
        { id: 'notificar-cliente', nombre: 'Notificar al Cliente Terminación del Caso', completado: false, descripcion: 'Notificar al cliente la terminación del caso' },
      ]
    }
  })
  console.log('✅ Creado proceso de liquidación')

  // ==========================================
  // DOCUMENTOS
  // ==========================================
  const tipoDocs = ['DEMANDA', 'PODER', 'CEDULA', 'ESTADOS_FINANCIEROS', 'CERTIFICACION_BANCARIA'] as const
  for (const caso of casos.slice(0, 3)) {
    for (let i = 0; i < 3; i++) {
      await prisma.documento.create({
        data: {
          nombre: `${tipoDocs[i]}_${caso.numeroCaso}`,
          tipo: tipoDocs[i],
          descripcion: `Documento de ${tipoDocs[i]} para el caso ${caso.numeroCaso}`,
          archivo: `/documentos/${caso.id}/${tipoDocs[i]}.pdf`,
          tamano: Math.floor(Math.random() * 5000) + 100,
          extension: 'pdf',
          casoId: caso.id
        }
      })
    }
  }
  console.log('✅ Creados documentos de ejemplo')

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
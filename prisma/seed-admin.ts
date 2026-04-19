/**
 * Script para crear usuario admin de prueba
 * 
 * Uso: npx tsx prisma/seed-admin.ts
 * 
 * Usuario: admin@gmail.com
 * Contraseña: 12345678
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Creando usuario admin de prueba...')

  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@gmail.com' }
    })

    if (existingUser) {
      console.log('⚠️  El usuario admin@gmail.com ya existe')
      return
    }

    // Obtener o crear el rol Administrador
    let adminRole = await prisma.role.findUnique({
      where: { nombre: 'Administrador' }
    })

    if (!adminRole) {
      console.log('📋 Creando rol Administrador...')
      
      // Crear todos los permisos primero
      const permissions = await Promise.all([
        // Dashboard
        prisma.permission.upsert({
          where: { nombre: 'dashboard.view' },
          update: {},
          create: {
            nombre: 'dashboard.view',
            descripcion: 'Ver dashboard principal',
            modulo: 'dashboard'
          }
        }),
        // Leads
        prisma.permission.upsert({
          where: { nombre: 'leads.view' },
          update: {},
          create: {
            nombre: 'leads.view',
            descripcion: 'Ver leads',
            modulo: 'leads'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'leads.create' },
          update: {},
          create: {
            nombre: 'leads.create',
            descripcion: 'Crear leads',
            modulo: 'leads'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'leads.edit' },
          update: {},
          create: {
            nombre: 'leads.edit',
            descripcion: 'Editar leads',
            modulo: 'leads'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'leads.delete' },
          update: {},
          create: {
            nombre: 'leads.delete',
            descripcion: 'Eliminar leads',
            modulo: 'leads'
          }
        }),
        // Casos
        prisma.permission.upsert({
          where: { nombre: 'casos.view' },
          update: {},
          create: {
            nombre: 'casos.view',
            descripcion: 'Ver casos',
            modulo: 'casos'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'casos.create' },
          update: {},
          create: {
            nombre: 'casos.create',
            descripcion: 'Crear casos',
            modulo: 'casos'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'casos.edit' },
          update: {},
          create: {
            nombre: 'casos.edit',
            descripcion: 'Editar casos',
            modulo: 'casos'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'casos.delete' },
          update: {},
          create: {
            nombre: 'casos.delete',
            descripcion: 'Eliminar casos',
            modulo: 'casos'
          }
        }),
        // Asesorías
        prisma.permission.upsert({
          where: { nombre: 'asesorias.view' },
          update: {},
          create: {
            nombre: 'asesorias.view',
            descripcion: 'Ver asesorías',
            modulo: 'asesorias'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'asesorias.create' },
          update: {},
          create: {
            nombre: 'asesorias.create',
            descripcion: 'Crear asesorías',
            modulo: 'asesorias'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'asesorias.edit' },
          update: {},
          create: {
            nombre: 'asesorias.edit',
            descripcion: 'Editar asesorías',
            modulo: 'asesorias'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'asesorias.delete' },
          update: {},
          create: {
            nombre: 'asesorias.delete',
            descripcion: 'Eliminar asesorías',
            modulo: 'asesorias'
          }
        }),
        // Usuarios
        prisma.permission.upsert({
          where: { nombre: 'usuarios.view' },
          update: {},
          create: {
            nombre: 'usuarios.view',
            descripcion: 'Ver usuarios',
            modulo: 'usuarios'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'usuarios.create' },
          update: {},
          create: {
            nombre: 'usuarios.create',
            descripcion: 'Crear usuarios',
            modulo: 'usuarios'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'usuarios.edit' },
          update: {},
          create: {
            nombre: 'usuarios.edit',
            descripcion: 'Editar usuarios',
            modulo: 'usuarios'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'usuarios.delete' },
          update: {},
          create: {
            nombre: 'usuarios.delete',
            descripcion: 'Eliminar usuarios',
            modulo: 'usuarios'
          }
        }),
        prisma.permission.upsert({
          where: { nombre: 'roles.manage' },
          update: {},
          create: {
            nombre: 'roles.manage',
            descripcion: 'Gestionar roles y permisos',
            modulo: 'usuarios'
          }
        }),
      ])

      // Crear el rol administrador
      adminRole = await prisma.role.create({
        data: {
          nombre: 'Administrador',
          descripcion: 'Acceso completo al sistema'
        }
      })

      // Asignar todos los permisos al rol
      for (const permission of permissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        })
      }

      console.log('✅ Rol Administrador creado con todos los permisos')
    }

    // Crear el usuario admin
    const hashedPassword = await bcrypt.hash('12345678', 12)

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        password: hashedPassword,
        nombre: 'Admin',
        apellido: 'Prueba',
        documento: '1111111111',
        telefono: '3001111111',
        activo: true,
        roleId: adminRole.id
      }
    })

    console.log('✅ Usuario creado exitosamente!')
    console.log('')
    console.log('═══════════════════════════════════════')
    console.log('📋 CREDENCIALES DE ACCESO')
    console.log('═══════════════════════════════════════')
    console.log(`📧 Email:      admin@gmail.com`)
    console.log(`🔐 Contraseña: 12345678`)
    console.log('═══════════════════════════════════════')
    console.log('')
    console.log('👤 ID de Usuario:', adminUser.id)
    console.log('🎯 Rol: Administrador (Acceso completo)')
    console.log('')

  } catch (error) {
    console.error('❌ Error al crear usuario:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

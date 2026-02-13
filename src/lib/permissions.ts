import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './db'

export interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions)
  return session?.user as User || null
}

export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  return user.permissions.includes(permission) || user.role === 'Administrador'
}

export async function requirePermission(permission: string): Promise<void> {
  const allowed = await hasPermission(permission)
  if (!allowed) {
    throw new Error('No tienes permisos para realizar esta acción')
  }
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  })

  if (!user) return []

  return user.role.permissions.map(p => p.permission.nombre)
}

export type PermissionModule = 
  | 'dashboard'
  | 'leads'
  | 'asesorias'
  | 'conciliaciones'
  | 'casos'
  | 'actuaciones'
  | 'audiencias'
  | 'honorarios'
  | 'facturacion'
  | 'cartera'
  | 'usuarios'

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage'

export function buildPermission(module: PermissionModule, action: PermissionAction): string {
  return `${module}.${action}`
}

// Constantes de permisos más comunes
export const PERMISSIONS = {
  DASHBOARD: {
    VIEW: 'dashboard.view',
  },
  LEADS: {
    VIEW: 'leads.view',
    CREATE: 'leads.create', 
    EDIT: 'leads.edit',
    DELETE: 'leads.delete',
  },
  ASESORIAS: {
    VIEW: 'asesorias.view',
    CREATE: 'asesorias.create',
    EDIT: 'asesorias.edit',
    DELETE: 'asesorias.delete',
  },
  CONCILIACIONES: {
    VIEW: 'conciliaciones.view',
    CREATE: 'conciliaciones.create',
    EDIT: 'conciliaciones.edit',
    DELETE: 'conciliaciones.delete',
  },
  CASOS: {
    VIEW: 'casos.view',
    CREATE: 'casos.create',
    EDIT: 'casos.edit',
    DELETE: 'casos.delete',
  },
  ACTUACIONES: {
    VIEW: 'actuaciones.view',
    CREATE: 'actuaciones.create',
    EDIT: 'actuaciones.edit',
  },
  AUDIENCIAS: {
    VIEW: 'audiencias.view',
    CREATE: 'audiencias.create',
    EDIT: 'audiencias.edit',
  },
  HONORARIOS: {
    VIEW: 'honorarios.view',
    CREATE: 'honorarios.create',
    EDIT: 'honorarios.edit',
  },
  FACTURACION: {
    VIEW: 'facturacion.view',
    CREATE: 'facturacion.create',
    EDIT: 'facturacion.edit',
  },
  CARTERA: {
    VIEW: 'cartera.view',
    MANAGE: 'cartera.manage',
  },
  USUARIOS: {
    VIEW: 'usuarios.view',
    CREATE: 'usuarios.create',
    EDIT: 'usuarios.edit',
    DELETE: 'usuarios.delete',
  },
  ROLES: {
    MANAGE: 'roles.manage',
  },
} as const
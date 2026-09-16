'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  Shield,
  Users,
  Key,
  Plus,
  Search,
  Edit,
  Eye,
  UserCheck,
  Settings
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Spinner } from '@/components/ui'

interface Role {
  id: string
  nombre: string
  descripcion: string | null
  createdAt: string
  _count: {
    users: number
  }
}

interface Permission {
  id: string
  nombre: string
  descripcion: string
  modulo: string
}

export default function PermisosPage() {
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [searchRoles, setSearchRoles] = useState('')
  const [searchPermissions, setSearchPermissions] = useState('')
  const [selectedModule, setSelectedModule] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [rolesResponse, permissionsResponse] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/permissions')
      ])

      if (rolesResponse.ok && permissionsResponse.ok) {
        const rolesData = await rolesResponse.json()
        const permissionsData = await permissionsResponse.json()
        setRoles(rolesData)
        setPermissions(permissionsData)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getModules = () => {
    return [...new Set(permissions.map(p => p.modulo))]
  }

  const filteredRoles = roles.filter(role =>
    role.nombre.toLowerCase().includes(searchRoles.toLowerCase()) ||
    (role.descripcion && role.descripcion.toLowerCase().includes(searchRoles.toLowerCase()))
  )

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.nombre.toLowerCase().includes(searchPermissions.toLowerCase()) ||
                         permission.descripcion.toLowerCase().includes(searchPermissions.toLowerCase())
    const matchesModule = !selectedModule || permission.modulo === selectedModule

    return matchesSearch && matchesModule
  })

  const getPermissionsByModule = () => {
    return filteredPermissions.reduce((acc, permission) => {
      if (!acc[permission.modulo]) {
        acc[permission.modulo] = []
      }
      acc[permission.modulo].push(permission)
      return acc
    }, {} as Record<string, Permission[]>)
  }

  if (loading) {
    return <Spinner />
  }

  const modules = getModules()
  const permissionsByModule = getPermissionsByModule()

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Usuarios', href: '/usuarios' },
          { label: 'Permisos y Roles' }
        ]}
      />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Permisos y Roles</h1>
          <p className="mb-0 text-slate-500">Gestiona los roles y permisos del sistema</p>
        </div>
        <Link href="/usuarios/permisos/roles/nuevo">
          <Button>
            <Plus size={16} />
            Nuevo Rol
          </Button>
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardBody className="text-center">
            <Shield className="mx-auto mb-2 text-blue-800" size={32} />
            <div className="mb-1 text-2xl font-bold text-blue-800">{roles.length}</div>
            <div className="text-sm text-slate-500">Roles Totales</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Key className="mx-auto mb-2 text-teal-700" size={32} />
            <div className="mb-1 text-2xl font-bold text-teal-700">{permissions.length}</div>
            <div className="text-sm text-slate-500">Permisos Totales</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <UserCheck className="mx-auto mb-2 text-sky-700" size={32} />
            <div className="mb-1 text-2xl font-bold text-sky-700">{roles.reduce((acc, role) => acc + role._count.users, 0)}</div>
            <div className="text-sm text-slate-500">Usuarios Asignados</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Settings className="mx-auto mb-2 text-amber-500" size={32} />
            <div className="mb-1 text-2xl font-bold text-amber-600">{modules.length}</div>
            <div className="text-sm text-slate-500">Módulos</div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Panel de Roles */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Roles del Sistema
            </CardTitle>
            <Badge variant="primary">{filteredRoles.length}</Badge>
          </CardHeader>
          <CardBody>
            {/* Buscador de Roles */}
            <div className="relative mb-3">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                className="pl-9"
                placeholder="Buscar roles..."
                value={searchRoles}
                onChange={(e) => setSearchRoles(e.target.value)}
              />
            </div>

            {/* Lista de Roles */}
            <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {filteredRoles.length === 0 ? (
                <div className="py-4 text-center text-slate-500">
                  <Shield size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No se encontraron roles</p>
                </div>
              ) : (
                filteredRoles.map((role) => (
                  <div key={role.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h6 className="mb-1 font-bold text-slate-800">{role.nombre}</h6>
                        {role.descripcion && (
                          <p className="mb-2 text-sm text-slate-500">{role.descripcion}</p>
                        )}
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            <Users size={12} />
                            {role._count.users} usuario(s)
                          </Badge>
                          <span className="text-sm text-slate-500">
                            Creado: {new Date(role.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Link href={`/usuarios/permisos/roles/${role.id}`}>
                          <Button variant="outlinePrimary" size="icon">
                            <Eye size={14} />
                          </Button>
                        </Link>
                        <Link href={`/usuarios/permisos/roles/${role.id}/editar`}>
                          <Button variant="outline" size="icon">
                            <Edit size={14} />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        {/* Panel de Permisos */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key size={20} />
              Permisos por Módulo
            </CardTitle>
            <Badge variant="success">{filteredPermissions.length}</Badge>
          </CardHeader>
          <CardBody>
            {/* Filtros de Permisos */}
            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  className="pl-9"
                  placeholder="Buscar permisos..."
                  value={searchPermissions}
                  onChange={(e) => setSearchPermissions(e.target.value)}
                />
              </div>
              <Select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
                <option value="">Todos los módulos</option>
                {modules.map(module => (
                  <option key={module} value={module}>{module.toUpperCase()}</option>
                ))}
              </Select>
            </div>

            {/* Lista de Permisos por Módulo */}
            <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
              {Object.keys(permissionsByModule).length === 0 ? (
                <div className="py-4 text-center text-slate-500">
                  <Key size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No se encontraron permisos</p>
                </div>
              ) : (
                Object.entries(permissionsByModule).map(([modulo, modulePermissions]) => (
                  <div key={modulo} className="mb-4">
                    <h6 className="mb-3 flex items-center border-b border-slate-200 pb-2 font-bold text-blue-800">
                      {modulo.toUpperCase()}
                      <Badge variant="outline" className="ml-2">{modulePermissions.length}</Badge>
                    </h6>
                    <div className="space-y-2">
                      {modulePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-start gap-2">
                          <Key size={14} className="mt-1 shrink-0 text-teal-700" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-800">{permission.nombre}</div>
                            {permission.descripcion && (
                              <div className="text-sm text-slate-500">{permission.descripcion}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}

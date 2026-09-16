'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Edit, Shield, Users, Key, AlertTriangle, Trash2, Check } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Spinner, Modal } from '@/components/ui'

interface Role {
  id: string
  nombre: string
  descripcion: string | null
  permissions: Permission[]
  _count: {
    usuarios: number
  }
}

interface Permission {
  id: string
  nombre: string
  descripcion: string
  modulo: string
}

interface User {
  id: string
  nombre: string
  email: string
  telefono: string | null
  activo: boolean
}

export default function RoleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roleId = params.roleId as string

  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingRole, setDeletingRole] = useState(false)
  const [showUsers, setShowUsers] = useState(false)

  useEffect(() => {
    if (roleId) {
      fetchRole()
    }
  }, [roleId])

  const fetchRole = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/roles?includePermissions=true`)

      if (response.ok) {
        const roles = await response.json()
        const currentRole = roles.find((r: Role) => r.id === roleId)
        if (currentRole) {
          setRole(currentRole)
        } else {
          router.push('/usuarios/permisos')
        }
      } else {
        console.error('Error al cargar el rol')
        router.push('/usuarios/permisos')
      }
    } catch (error) {
      console.error('Error al cargar el rol:', error)
      router.push('/usuarios/permisos')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    if (!role || users.length > 0) return

    try {
      setLoadingUsers(true)
      const response = await fetch(`/api/usuarios?roleId=${roleId}`)

      if (response.ok) {
        const data = await response.json()
        setUsers(data.usuarios || [])
      } else {
        console.error('Error al cargar usuarios')
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!role) return

    try {
      setDeletingRole(true)
      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/usuarios/permisos')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar el rol')
      }
    } catch (error) {
      console.error('Error al eliminar el rol:', error)
      alert('Error de conexión. Inténtelo de nuevo.')
    } finally {
      setDeletingRole(false)
      setShowDeleteModal(false)
    }
  }

  const handleShowUsers = () => {
    setShowUsers(true)
    fetchUsers()
  }

  const getPermissionsByModule = () => {
    if (!role) return {}

    return role.permissions.reduce((acc, permission) => {
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

  if (!role) {
    return (
      <div className="py-5 text-center">
        <Alert variant="warning">No se encontró el rol especificado</Alert>
      </div>
    )
  }

  const permissionsByModule = getPermissionsByModule()

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Usuarios', href: '/usuarios' },
          { label: 'Permisos y Roles', href: '/usuarios/permisos' },
          { label: role.nombre }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/usuarios/permisos">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-800" size={24} />
            <h1 className="mb-0 text-2xl font-bold text-slate-800">{role.nombre}</h1>
          </div>
          {role.descripcion && (
            <p className="mb-0 text-slate-500">{role.descripcion}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/usuarios/permisos/roles/${role.id}/editar`}>
            <Button>
              <Edit size={16} />
              Editar Rol
            </Button>
          </Link>
          <Button variant="outlineDanger" onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {/* Información del Rol */}
          <Card>
            <CardHeader><CardTitle>Información del Rol</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div><strong>Nombre:</strong> {role.nombre}</div>
                <div className="flex items-center gap-2">
                  <strong>Usuarios Asignados:</strong>
                  <Badge variant="primary">{role._count.usuarios}</Badge>
                </div>
              </div>
              {role.descripcion && (
                <div className="mt-3">
                  <strong>Descripción:</strong>
                  <p className="mb-0 mt-1">{role.descripcion}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Permisos del Rol */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key size={20} />
                Permisos del Rol ({role.permissions.length} total)
              </CardTitle>
            </CardHeader>
            <CardBody>
              {Object.keys(permissionsByModule).length === 0 ? (
                <div className="py-4 text-center text-slate-500">
                  <Key size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Este rol no tiene permisos asignados</p>
                </div>
              ) : (
                Object.entries(permissionsByModule).map(([modulo, perms]) => (
                  <div key={modulo} className="mb-4">
                    <h6 className="mb-3 flex items-center border-b border-slate-200 pb-2 font-bold text-blue-800">
                      {modulo.toUpperCase()}
                      <Badge variant="outline" className="ml-2">{perms.length}</Badge>
                    </h6>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-start gap-2">
                          <Check size={16} className="mt-1 shrink-0 text-teal-700" />
                          <div>
                            <div className="font-semibold text-slate-800">{permission.nombre}</div>
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
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          {/* Estadísticas */}
          <Card>
            <CardHeader><CardTitle>Estadísticas</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="mb-1 text-2xl font-bold text-blue-800">{role._count.usuarios}</div>
                  <div className="text-sm text-slate-500">Usuarios</div>
                </div>
                <div>
                  <div className="mb-1 text-2xl font-bold text-teal-700">{role.permissions.length}</div>
                  <div className="text-sm text-slate-500">Permisos</div>
                </div>
              </div>
              <hr className="my-3 border-slate-200" />
              <div className="text-center">
                <div className="mb-1 text-2xl font-bold text-sky-700">{Object.keys(permissionsByModule).length}</div>
                <div className="text-sm text-slate-500">Módulos con acceso</div>
              </div>
            </CardBody>
          </Card>

          {/* Usuarios Asignados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                Usuarios Asignados
              </CardTitle>
            </CardHeader>
            <CardBody>
              {role._count.usuarios === 0 ? (
                <div className="py-3 text-center text-slate-500">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="mb-0">No hay usuarios asignados</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <span>Total: <strong>{role._count.usuarios}</strong> usuarios</span>
                    {!showUsers && (
                      <Button variant="outlinePrimary" size="sm" onClick={handleShowUsers} disabled={loadingUsers}>
                        {loadingUsers ? 'Cargando...' : 'Ver usuarios'}
                      </Button>
                    )}
                  </div>

                  {showUsers && (
                    <div className="mt-3">
                      {loadingUsers ? (
                        <Spinner />
                      ) : users.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between py-2">
                              <div>
                                <div className="font-semibold text-slate-800">{user.nombre}</div>
                                <div className="text-sm text-slate-500">{user.email}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={user.activo ? 'success' : 'secondary'}>
                                  {user.activo ? 'Activo' : 'Inactivo'}
                                </Badge>
                                <Link href={`/usuarios/${user.id}`}>
                                  <Button variant="outline" size="sm">Ver</Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-2 text-center text-slate-500">
                          No se encontraron usuarios
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <Modal
          onClose={() => setShowDeleteModal(false)}
          title="Confirmar Eliminación"
          icon={<AlertTriangle className="text-amber-500" size={20} />}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deletingRole}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDeleteRole} loading={deletingRole}>
                {!deletingRole && <Trash2 size={16} />}
                {deletingRole ? 'Eliminando...' : 'Eliminar Rol'}
              </Button>
            </>
          }
        >
          <p>¿Está seguro que desea eliminar el rol <strong>&quot;{role.nombre}&quot;</strong>?</p>
          {role._count.usuarios > 0 && (
            <Alert variant="warning" className="my-3">
              <strong>Atención:</strong> Este rol tiene {role._count.usuarios} usuario(s) asignado(s).
              Al eliminar el rol, los usuarios perderán estos permisos.
            </Alert>
          )}
          <p className="mb-0 text-slate-500">Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </>
  )
}

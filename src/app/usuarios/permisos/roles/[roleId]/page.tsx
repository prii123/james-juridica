'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Edit, Shield, Users, Key, AlertTriangle, Trash2, Check, X } from 'lucide-react'

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
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (!role) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-warning">
          No se encontró el rol especificado
        </div>
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

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/usuarios/permisos" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2">
            <Shield className="text-primary" size={24} />
            <h1 className="h2 fw-bold text-dark mb-0">{role.nombre}</h1>
          </div>
          {role.descripcion && (
            <p className="text-secondary mb-0">{role.descripcion}</p>
          )}
        </div>
        <div className="d-flex gap-2">
          <Link 
            href={`/usuarios/permisos/roles/${role.id}/editar`} 
            className="btn btn-primary"
          >
            <Edit size={16} className="me-1" />
            Editar Rol
          </Link>
          <button 
            className="btn btn-outline-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Información del Rol */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Información del Rol</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <strong>Nombre:</strong> {role.nombre}
                </div>
                <div className="col-md-6">
                  <strong>Usuarios Asignados:</strong> 
                  <span className="badge bg-primary ms-2">{role._count.usuarios}</span>
                </div>
              </div>
              {role.descripcion && (
                <div className="mt-3">
                  <strong>Descripción:</strong>
                  <p className="mb-0 mt-1">{role.descripcion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Permisos del Rol */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <Key size={20} className="me-2" />
                Permisos del Rol ({role.permissions.length} total)
              </h5>
            </div>
            <div className="card-body">
              {Object.keys(permissionsByModule).length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <Key size={48} className="opacity-50 mb-3" />
                  <p>Este rol no tiene permisos asignados</p>
                </div>
              ) : (
                Object.entries(permissionsByModule).map(([modulo, permissions]) => (
                  <div key={modulo} className="mb-4">
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
                      {modulo.toUpperCase()}
                      <span className="badge bg-light text-dark ms-2">{permissions.length}</span>
                    </h6>
                    <div className="row">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="col-md-6 mb-2">
                          <div className="d-flex align-items-start">
                            <Check size={16} className="text-success me-2 mt-1 flex-shrink-0" />
                            <div>
                              <div className="fw-semibold">{permission.nombre}</div>
                              {permission.descripcion && (
                                <div className="small text-muted">{permission.descripcion}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Estadísticas */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Estadísticas</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <div className="text-center">
                    <div className="h4 fw-bold text-primary mb-1">{role._count.usuarios}</div>
                    <div className="small text-muted">Usuarios</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center">
                    <div className="h4 fw-bold text-success mb-1">{role.permissions.length}</div>
                    <div className="small text-muted">Permisos</div>
                  </div>
                </div>
              </div>
              <hr />
              <div className="text-center">
                <div className="h4 fw-bold text-info mb-1">{Object.keys(permissionsByModule).length}</div>
                <div className="small text-muted">Módulos con acceso</div>
              </div>
            </div>
          </div>

          {/* Usuarios Asignados */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <Users size={20} className="me-2" />
                Usuarios Asignados
              </h5>
            </div>
            <div className="card-body">
              {role._count.usuarios === 0 ? (
                <div className="text-center py-3 text-muted">
                  <Users size={32} className="opacity-50 mb-2" />
                  <p className="mb-0">No hay usuarios asignados</p>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span>Total: <strong>{role._count.usuarios}</strong> usuarios</span>
                    {!showUsers && (
                      <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={handleShowUsers}
                        disabled={loadingUsers}
                      >
                        {loadingUsers ? 'Cargando...' : 'Ver usuarios'}
                      </button>
                    )}
                  </div>

                  {showUsers && (
                    <div className="mt-3">
                      {loadingUsers ? (
                        <div className="text-center">
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                        </div>
                      ) : users.length > 0 ? (
                        <div className="list-group list-group-flush">
                          {users.map((user) => (
                            <div key={user.id} className="list-group-item px-0">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-semibold">{user.nombre}</div>
                                  <div className="small text-muted">{user.email}</div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span 
                                    className={`badge ${user.activo ? 'bg-success' : 'bg-secondary'}`}
                                  >
                                    {user.activo ? 'Activo' : 'Inactivo'}
                                  </span>
                                  <Link 
                                    href={`/usuarios/${user.id}`}
                                    className="btn btn-outline-secondary btn-sm"
                                  >
                                    Ver
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted py-2">
                          No se encontraron usuarios
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <AlertTriangle className="text-warning me-2" size={20} />
                  Confirmar Eliminación
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Está seguro que desea eliminar el rol <strong>&quot;{role.nombre}&quot;</strong>?</p>
                {role._count.usuarios > 0 && (
                  <div className="alert alert-warning">
                    <strong>Atención:</strong> Este rol tiene {role._count.usuarios} usuario(s) asignado(s). 
                    Al eliminar el rol, los usuarios perderán estos permisos.
                  </div>
                )}
                <p className="text-muted">Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingRole}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleDeleteRole}
                  disabled={deletingRole}
                >
                  {deletingRole ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} className="me-1" />
                      Eliminar Rol
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
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
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  Settings
} from 'lucide-react'

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
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
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

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Permisos y Roles</h1>
          <p className="text-secondary mb-0">Gestiona los roles y permisos del sistema</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/usuarios/permisos/roles/nuevo" className="btn btn-primary">
            <Plus size={16} className="me-1" />
            Nuevo Rol
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <Shield className="text-primary mb-2" size={32} />
              <div className="h4 fw-bold text-primary mb-1">{roles.length}</div>
              <div className="text-muted small">Roles Totales</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <Key className="text-success mb-2" size={32} />
              <div className="h4 fw-bold text-success mb-1">{permissions.length}</div>
              <div className="text-muted small">Permisos Totales</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <UserCheck className="text-info mb-2" size={32} />
              <div className="h4 fw-bold text-info mb-1">{roles.reduce((acc, role) => acc + role._count.users, 0)}</div>
              <div className="text-muted small">Usuarios Asignados</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <Settings className="text-warning mb-2" size={32} />
              <div className="h4 fw-bold text-warning mb-1">{modules.length}</div>
              <div className="text-muted small">Módulos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Panel de Roles */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <Shield size={20} className="me-2" />
                  Roles del Sistema
                </h5>
                <span className="badge bg-primary">{filteredRoles.length}</span>
              </div>
            </div>
            <div className="card-body">
              
              {/* Buscador de Roles */}
              <div className="input-group mb-3">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar roles..."
                  value={searchRoles}
                  onChange={(e) => setSearchRoles(e.target.value)}
                />
              </div>

              {/* Lista de Roles */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {filteredRoles.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <Shield size={48} className="opacity-50 mb-3" />
                    <p>No se encontraron roles</p>
                  </div>
                ) : (
                  filteredRoles.map((role) => (
                    <div key={role.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="fw-bold text-dark mb-1">{role.nombre}</h6>
                          {role.descripcion && (
                            <p className="text-muted small mb-2">{role.descripcion}</p>
                          )}
                          <div className="d-flex align-items-center gap-3">
                            <span className="badge bg-light text-dark">
                              <Users size={12} className="me-1" />
                              {role._count.users} usuario(s)
                            </span>
                            <span className="small text-muted">
                              Creado: {new Date(role.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <Link 
                            href={`/usuarios/permisos/roles/${role.id}`}
                            className="btn btn-outline-primary btn-sm"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link 
                            href={`/usuarios/permisos/roles/${role.id}/editar`}
                            className="btn btn-outline-secondary btn-sm"
                          >
                            <Edit size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Permisos */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <Key size={20} className="me-2" />
                  Permisos por Módulo
                </h5>
                <span className="badge bg-success">{filteredPermissions.length}</span>
              </div>
            </div>
            <div className="card-body">
              
              {/* Filtros de Permisos */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar permisos..."
                      value={searchPermissions}
                      onChange={(e) => setSearchPermissions(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <select 
                    className="form-select"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                  >
                    <option value="">Todos los módulos</option>
                    {modules.map(module => (
                      <option key={module} value={module}>{module.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de Permisos por Módulo */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {Object.keys(permissionsByModule).length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <Key size={48} className="opacity-50 mb-3" />
                    <p>No se encontraron permisos</p>
                  </div>
                ) : (
                  Object.entries(permissionsByModule).map(([modulo, modulePermissions]) => (
                    <div key={modulo} className="mb-4">
                      <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
                        {modulo.toUpperCase()}
                        <span className="badge bg-light text-dark ms-2">{modulePermissions.length}</span>
                      </h6>
                      <div className="row">
                        {modulePermissions.map((permission) => (
                          <div key={permission.id} className="col-12 mb-2">
                            <div className="d-flex align-items-start">
                              <Key size={14} className="text-success me-2 mt-1 flex-shrink-0" />
                              <div className="flex-grow-1">
                                <div className="fw-semibold small">{permission.nombre}</div>
                                {permission.descripcion && (
                                  <div className="text-muted small">{permission.descripcion}</div>
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
        </div>
      </div>
    </>
  )
}
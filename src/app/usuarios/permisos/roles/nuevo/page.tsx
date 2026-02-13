'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Shield, Key, Check } from 'lucide-react'

interface CreateRoleData {
  nombre: string
  descripcion: string
  permissionIds: string[]
}

interface Permission {
  id: string
  nombre: string
  descripcion: string
  modulo: string
}

export default function NuevoRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [permissions, setPermissions] = useState<Permission[]>([])
  
  const [formData, setFormData] = useState<CreateRoleData>({
    nombre: '',
    descripcion: '',
    permissionIds: []
  })

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoadingData(true)
      const response = await fetch('/api/permissions')
      
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      } else {
        console.error('Error al cargar permisos')
      }
    } catch (error) {
      console.error('Error al cargar permisos:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const roleData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        permissionIds: formData.permissionIds
      }

      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      })

      if (response.ok) {
        const role = await response.json()
        router.push(`/usuarios/permisos/roles/${role.id}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.error || 'Error al crear el rol' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateRoleData, value: string | string[]) => {
    setFormData({ ...formData, [field]: value })
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handlePermissionToggle = (permissionId: string) => {
    const currentPermissions = formData.permissionIds
    const isSelected = currentPermissions.includes(permissionId)
    
    if (isSelected) {
      handleInputChange('permissionIds', currentPermissions.filter(id => id !== permissionId))
    } else {
      handleInputChange('permissionIds', [...currentPermissions, permissionId])
    }
  }

  const handleModuleToggle = (modulo: string) => {
    const modulePermissions = permissions.filter(p => p.modulo === modulo)
    const modulePermissionIds = modulePermissions.map(p => p.id)
    const currentPermissions = formData.permissionIds
    
    // Verificar si todos los permisos del módulo están seleccionados
    const allSelected = modulePermissionIds.every(id => currentPermissions.includes(id))
    
    if (allSelected) {
      // Deseleccionar todos los permisos del módulo
      handleInputChange('permissionIds', currentPermissions.filter(id => !modulePermissionIds.includes(id)))
    } else {
      // Seleccionar todos los permisos del módulo
      const newPermissions = [...new Set([...currentPermissions, ...modulePermissionIds])]
      handleInputChange('permissionIds', newPermissions)
    }
  }

  const getModules = () => {
    return [...new Set(permissions.map(p => p.modulo))]
  }

  const getPermissionsByModule = (modulo: string) => {
    return permissions.filter(p => p.modulo === modulo)
  }

  const isModuleFullySelected = (modulo: string) => {
    const modulePermissions = getPermissionsByModule(modulo)
    return modulePermissions.length > 0 && modulePermissions.every(p => formData.permissionIds.includes(p.id))
  }

  const isModulePartiallySelected = (modulo: string) => {
    const modulePermissions = getPermissionsByModule(modulo)
    return modulePermissions.some(p => formData.permissionIds.includes(p.id)) && !isModuleFullySelected(modulo)
  }

  if (loadingData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Usuarios', href: '/usuarios' },
          { label: 'Permisos y Roles', href: '/usuarios/permisos' },
          { label: 'Nuevo Rol' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/usuarios/permisos" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Nuevo Rol</h1>
          <p className="text-secondary mb-0">Crear un nuevo rol del sistema con permisos específicos</p>
        </div>
      </div>

      {errors.general && (
        <div className="alert alert-danger" role="alert">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Información del Rol</h5>
              </div>
              <div className="card-body">
                
                {/* Nombre del Rol */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nombre del Rol *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Ej: ASESOR, ABOGADO, ADMIN"
                    required
                  />
                  {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                  <div className="form-text">
                    Use nombres en mayúsculas y descriptivos (ADMIN, ASESOR, ABOGADO, etc.)
                  </div>
                </div>

                {/* Descripción */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Descripción</label>
                  <textarea
                    className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción del rol y sus responsabilidades..."
                  />
                  {errors.descripcion && <div className="invalid-feedback">{errors.descripcion}</div>}
                </div>

              </div>
            </div>

            {/* Permisos */}
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <Key size={20} className="me-2" />
                  Permisos del Rol ({formData.permissionIds.length} seleccionados)
                </h5>
              </div>
              <div className="card-body">
                
                {/* Permisos por Módulo */}
                {getModules().map((modulo) => {
                  const modulePermissions = getPermissionsByModule(modulo)
                  const fullySelected = isModuleFullySelected(modulo)
                  const partiallySelected = isModulePartiallySelected(modulo)

                  return (
                    <div key={modulo} className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`module-${modulo}`}
                            checked={fullySelected}
                            ref={(el) => {
                              if (el) el.indeterminate = partiallySelected;
                            }}
                            onChange={() => handleModuleToggle(modulo)}
                          />
                          <label 
                            className="form-check-label fw-bold text-primary" 
                            htmlFor={`module-${modulo}`}
                          >
                            {modulo.toUpperCase()}
                          </label>
                        </div>
                        <span className="badge bg-light text-dark ms-auto">
                          {modulePermissions.filter(p => formData.permissionIds.includes(p.id)).length} / {modulePermissions.length}
                        </span>
                      </div>

                      <div className="row ms-3">
                        {modulePermissions.map((permission) => (
                          <div key={permission.id} className="col-md-6 mb-2">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`permission-${permission.id}`}
                                checked={formData.permissionIds.includes(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                              />
                              <label 
                                className="form-check-label" 
                                htmlFor={`permission-${permission.id}`}
                              >
                                <div className="fw-semibold">{permission.nombre}</div>
                                {permission.descripcion && (
                                  <div className="small text-muted">{permission.descripcion}</div>
                                )}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Acciones</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Creando Rol...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Crear Rol
                      </>
                    )}
                  </button>
                  <Link href="/usuarios/permisos" className="btn btn-outline-secondary">
                    Cancelar
                  </Link>
                </div>

                <hr />

                <div className="text-muted small">
                  <h6>Resumen:</h6>
                  <ul className="list-unstyled">
                    <li>• <strong>Rol:</strong> {formData.nombre || 'Sin nombre'}</li>
                    <li>• <strong>Permisos:</strong> {formData.permissionIds.length}</li>
                    <li>• <strong>Módulos:</strong> {
                      getModules().filter(modulo => 
                        getPermissionsByModule(modulo).some(p => 
                          formData.permissionIds.includes(p.id)
                        )
                      ).length
                    }</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h6 className="mb-0">Información</h6>
              </div>
              <div className="card-body">
                <div className="small text-muted">
                  <ul className="list-unstyled mb-0">
                    <li>• Los permisos se agrupan por módulos</li>
                    <li>• Puede seleccionar módulos completos o permisos individuales</li>
                    <li>• El nombre del rol debe ser único en el sistema</li>
                    <li>• Los usuarios heredarán estos permisos cuando se les asigne este rol</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
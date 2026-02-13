'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User, Mail, Shield, Lock } from 'lucide-react'

interface EditUsuarioData {
  nombre: string
  apellido: string  
  email: string
  telefono: string
  documento: string
  roleId: string
  activo: boolean
  changePassword: boolean
  newPassword: string
  confirmPassword: string
}

interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  documento?: string
  activo: boolean
  role: {
    id: string
    nombre: string
    descripcion: string
  }
}

interface Role {
  id: string
  nombre: string
  descripcion: string
}

export default function EditUsuarioPage({ params }: { params: { usuarioId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [roles, setRoles] = useState<Role[]>([])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  
  const [formData, setFormData] = useState<EditUsuarioData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    documento: '',
    roleId: '',
    activo: true,
    changePassword: false,
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoadingData(true)
      
      // Cargar usuario y roles en paralelo
      const [usuarioResponse, rolesResponse] = await Promise.all([
        fetch(`/api/usuarios/${params.usuarioId}`),
        fetch('/api/roles')
      ])

      if (usuarioResponse.ok) {
        const usuarioData = await usuarioResponse.json()
        setUsuario(usuarioData)
        
        // Llenar formulario con datos existentes
        setFormData({
          nombre: usuarioData.nombre,
          apellido: usuarioData.apellido,
          email: usuarioData.email,
          telefono: usuarioData.telefono || '',
          documento: usuarioData.documento || '',
          roleId: usuarioData.role.id,
          activo: usuarioData.activo,
          changePassword: false,
          newPassword: '',
          confirmPassword: ''
        })
      }

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        setRoles(rolesData)
      }

    } catch (error) {
      console.error('Error al cargar datos:', error)
      setErrors({ general: 'Error al cargar datos' })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Validación de contraseñas si se está cambiando
    if (formData.changePassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setErrors({ confirmPassword: 'Las contraseñas no coinciden' })
        setLoading(false)
        return
      }

      if (formData.newPassword.length < 8) {
        setErrors({ newPassword: 'La contraseña debe tener al menos 8 caracteres' })
        setLoading(false)
        return
      }
    }

    try {
      const updateData: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono || null,
        documento: formData.documento || null,
        roleId: formData.roleId,
        activo: formData.activo
      }

      // Solo incluir password si se está cambiando
      if (formData.changePassword && formData.newPassword) {
        updateData.password = formData.newPassword
      }

      const response = await fetch(`/api/usuarios/${params.usuarioId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        router.push(`/usuarios/${params.usuarioId}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.error || 'Error al actualizar el usuario' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof EditUsuarioData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
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

  if (!usuario) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          Usuario no encontrado
        </div>
        <Link href="/usuarios" className="btn btn-primary">
          Volver a Usuarios
        </Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Usuarios', href: '/usuarios' },
          { label: `${usuario.nombre} ${usuario.apellido}`, href: `/usuarios/${params.usuarioId}` },
          { label: 'Editar' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href={`/usuarios/${params.usuarioId}`} className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Editar Usuario</h1>
          <p className="text-secondary mb-0">
            Modificar información de {usuario.nombre} {usuario.apellido}
          </p>
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
                <h5 className="mb-0">Información Personal</h5>
              </div>
              <div className="card-body">
                
                {/* Nombre y Apellido */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Nombre *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                        value={formData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        placeholder="Nombre del usuario"
                        required
                      />
                      {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Apellido *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.apellido ? 'is-invalid' : ''}`}
                        value={formData.apellido}
                        onChange={(e) => handleInputChange('apellido', e.target.value)}
                        placeholder="Apellido del usuario"
                        required
                      />
                      {errors.apellido && <div className="invalid-feedback">{errors.apellido}</div>}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Correo Electrónico *</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="usuario@empresa.com"
                      required
                    />
                  </div>
                  {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                </div>

                {/* Documento y Teléfono */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Documento</label>
                      <input
                        type="text"
                        className={`form-control ${errors.documento ? 'is-invalid' : ''}`}
                        value={formData.documento}
                        onChange={(e) => handleInputChange('documento', e.target.value)}
                        placeholder="Número de identificación"
                      />
                      {errors.documento && <div className="invalid-feedback">{errors.documento}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Teléfono</label>
                      <input
                        type="tel"
                        className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                        value={formData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                        placeholder="Número de teléfono"
                      />
                      {errors.telefono && <div className="invalid-feedback">{errors.telefono}</div>}
                    </div>
                  </div>
                </div>

                {/* Rol */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Rol del Usuario *</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Shield size={16} />
                    </span>
                    <select
                      className={`form-select ${errors.roleId ? 'is-invalid' : ''}`}
                      value={formData.roleId}
                      onChange={(e) => handleInputChange('roleId', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar rol</option>
                      {roles.map((rol) => (
                        <option key={rol.id} value={rol.id}>
                          {rol.nombre} - {rol.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.roleId && <div className="invalid-feedback d-block">{errors.roleId}</div>}
                </div>

                {/* Estado */}
                <div className="mb-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => handleInputChange('activo', e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="activo">
                      Usuario Activo
                    </label>
                  </div>
                  <div className="form-text">
                    Los usuarios inactivos no podrán acceder al sistema
                  </div>
                </div>

                {/* Cambio de Contraseña */}
                <hr />
                <h6>Cambio de Contraseña</h6>
                
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="changePassword"
                      checked={formData.changePassword}
                      onChange={(e) => handleInputChange('changePassword', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="changePassword">
                      Cambiar contraseña del usuario
                    </label>
                  </div>
                </div>

                {formData.changePassword && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Nueva Contraseña *</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <Lock size={16} />
                          </span>
                          <input
                            type="password"
                            className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            required
                            minLength={8}
                          />
                        </div>
                        {errors.newPassword && <div className="invalid-feedback d-block">{errors.newPassword}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Confirmar Nueva Contraseña *</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <Lock size={16} />
                          </span>
                          <input
                            type="password"
                            className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            placeholder="Repetir nueva contraseña"
                            required
                          />
                        </div>
                        {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                      </div>
                    </div>
                  </div>
                )}

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
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                  <Link href={`/usuarios/${params.usuarioId}`} className="btn btn-outline-secondary">
                    Cancelar
                  </Link>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h6 className="mb-0">Usuario Actual</h6>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <User size={16} />
                  <span className="fw-semibold">{usuario.nombre} {usuario.apellido}</span>
                </div>
                <div className="text-muted small">
                  <div>Email: {usuario.email}</div>
                  <div>Rol: <span className="badge bg-primary">{usuario.role.nombre}</span></div>
                  <div>Estado: <span className={`badge ${usuario.activo ? 'bg-success' : 'bg-secondary'}`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
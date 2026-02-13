'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User, Mail, Lock, Shield } from 'lucide-react'

interface CreateUsuarioData {
  nombre: string
  apellido: string  
  email: string
  password: string
  confirmPassword: string
  telefono: string
  documento: string
  roleId: string
  activo: boolean
}

interface Role {
  id: string
  nombre: string
  descripcion: string
}

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [roles, setRoles] = useState<Role[]>([])
  
  const [formData, setFormData] = useState<CreateUsuarioData>({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    documento: '',
    roleId: '',
    activo: true
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoadingData(true)
      const response = await fetch('/api/roles')
      
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        console.error('Error al cargar roles')
      }
    } catch (error) {
      console.error('Error al cargar roles:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Validación de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' })
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setErrors({ password: 'La contraseña debe tener al menos 8 caracteres' })
      setLoading(false)
      return
    }

    try {
      const userData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password,
        telefono: formData.telefono || null,
        documento: formData.documento || null,
        roleId: formData.roleId,
        activo: formData.activo
      }

      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const usuario = await response.json()
        router.push(`/usuarios/${usuario.id}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.error || 'Error al crear el usuario' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateUsuarioData, value: string | boolean) => {
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

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Usuarios', href: '/usuarios' },
          { label: 'Nuevo Usuario' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/usuarios" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Nuevo Usuario</h1>
          <p className="text-secondary mb-0">Crear un nuevo usuario del sistema</p>
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

                {/* Contraseñas */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Contraseña *</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Lock size={16} />
                        </span>
                        <input
                          type="password"
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          required
                          minLength={8}
                        />
                      </div>
                      {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Confirmar Contraseña *</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Lock size={16} />
                        </span>
                        <input
                          type="password"
                          className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Repetir contraseña"
                          required
                        />
                      </div>
                      {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                    </div>
                  </div>
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
                <div className="mb-3">
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
                        Creando Usuario...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Crear Usuario
                      </>
                    )}
                  </button>
                  <Link href="/usuarios" className="btn btn-outline-secondary">
                    Cancelar
                  </Link>
                </div>

                <hr />

                <div className="text-muted small">
                  <h6>Información:</h6>
                  <ul className="list-unstyled">
                    <li>• Los campos marcados con * son obligatorios</li>
                    <li>• La contraseña debe tener mínimo 8 caracteres</li>
                    <li>• El rol determinará los permisos del usuario</li>
                    <li>• Se enviará un email de bienvenida al usuario</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h6 className="mb-0">Roles Disponibles</h6>
              </div>
              <div className="card-body">
                <div className="small">
                  {roles.map((rol) => (
                    <div key={rol.id} className="mb-2">
                      <strong>{rol.nombre}:</strong> {rol.descripcion}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
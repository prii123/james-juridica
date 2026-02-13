'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Edit3, 
  Mail, 
  Phone, 
  CreditCard, 
  User, 
  Shield, 
  Calendar,
  UserCheck,
  UserX,
  Key,
  Activity
} from 'lucide-react'

interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  documento?: string
  activo: boolean
  createdAt: string
  updatedAt: string
  role: {
    id: string
    nombre: string
    descripcion: string
  }
}

export default function UsuarioDetailPage({ params }: { params: { usuarioId: string } }) {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchUsuario()
  }, [])

  const fetchUsuario = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/usuarios/${params.usuarioId}`)
      
      if (response.ok) {
        const data = await response.json()
        setUsuario(data)
      } else {
        setError('No se pudo cargar el usuario')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!usuario) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/usuarios/${params.usuarioId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: !usuario.activo }),
      })

      if (response.ok) {
        const updatedUsuario = await response.json()
        setUsuario(updatedUsuario)
      } else {
        setError('No se pudo actualizar el estado del usuario')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN': return 'danger'
      case 'ASESOR': return 'primary'
      case 'ABOGADO': return 'success'
      case 'ASISTENTE': return 'info'
      default: return 'secondary'
    }
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

  if (error || !usuario) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Usuario no encontrado'}
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
          { label: `${usuario.nombre} ${usuario.apellido}` }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/usuarios" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-3 mb-1">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{width: '48px', height: '48px'}}>
              {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
            </div>
            <div>
              <h1 className="h3 fw-bold text-dark mb-0">
                {usuario.nombre} {usuario.apellido}
              </h1>
              <div className="d-flex align-items-center gap-2">
                <span className={`badge bg-${getRoleBadgeColor(usuario.role.nombre)}`}>
                  {usuario.role.nombre}
                </span>
                {usuario.activo ? (
                  <span className="badge bg-success">Activo</span>
                ) : (
                  <span className="badge bg-secondary">Inactivo</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <Link 
          href={`/usuarios/${params.usuarioId}/editar`}
          className="btn btn-outline-primary d-flex align-items-center gap-2"
        >
          <Edit3 size={16} />
          Editar
        </Link>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Información Personal */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Información Personal</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Mail size={16} className="text-muted" />
                      <span className="fw-semibold text-muted">Correo Electrónico</span>
                    </div>
                    <div>{usuario.email}</div>
                  </div>
                  
                  {usuario.telefono && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <Phone size={16} className="text-muted" />
                        <span className="fw-semibold text-muted">Teléfono</span>  
                      </div>
                      <div>{usuario.telefono}</div>
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  {usuario.documento && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <CreditCard size={16} className="text-muted" />
                        <span className="fw-semibold text-muted">Documento</span>
                      </div>
                      <div>{usuario.documento}</div>
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Shield size={16} className="text-muted" />
                      <span className="fw-semibold text-muted">Rol del Sistema</span>
                    </div>
                    <div>
                      <span className={`badge bg-${getRoleBadgeColor(usuario.role.nombre)} me-2`}>
                        {usuario.role.nombre}
                      </span>
                      <span className="text-muted">{usuario.role.descripcion}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Actividad */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Registros del Sistema</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Calendar size={16} className="text-muted" />
                    <span className="fw-semibold text-muted">Creado</span>
                  </div>
                  <div className="mb-4">{formatDate(usuario.createdAt)}</div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Activity size={16} className="text-muted" />
                    <span className="fw-semibold text-muted">Última Actualización</span>
                  </div>
                  <div className="mb-4">{formatDate(usuario.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Acciones */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Acciones</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link 
                  href={`/usuarios/${params.usuarioId}/editar`}
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                >
                  <Edit3 size={16} />
                  Editar Usuario
                </Link>
                
                <button
                  onClick={handleStatusToggle}
                  className={`btn ${usuario.activo ? 'btn-outline-warning' : 'btn-outline-success'} d-flex align-items-center justify-content-center gap-2`}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Actualizando...
                    </>
                  ) : usuario.activo ? (
                    <>
                      <UserX size={16} />
                      Desactivar Usuario
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} />
                      Activar Usuario
                    </>
                  )}
                </button>

                <button
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                  onClick={() => {
                    // Implementar funcionalidad de reset de contraseña
                    alert('Funcionalidad de reset de contraseña por implementar')
                  }}
                >
                  <Key size={16} />
                  Restablecer Contraseña
                </button>
              </div>
            </div>
          </div>

          {/* Información del Rol */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Rol y Permisos</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Shield size={20} className={`text-${getRoleBadgeColor(usuario.role.nombre) === 'danger' ? 'danger' : getRoleBadgeColor(usuario.role.nombre) === 'primary' ? 'primary' : 'success'}`} />
                <div>
                  <div className="fw-semibold">{usuario.role.nombre}</div>
                  <div className="small text-muted">{usuario.role.descripcion}</div>
                </div>
              </div>

              <div className="small text-muted">
                <strong>Permisos del rol:</strong>
                <ul className="mt-2 mb-0">
                  {usuario.role.nombre === 'ADMIN' && (
                    <>
                      <li>Gestión completa de usuarios</li>
                      <li>Configuración del sistema</li>
                      <li>Acceso a todos los módulos</li>
                    </>
                  )}
                  {usuario.role.nombre === 'ASESOR' && (
                    <>
                      <li>Gestión de leads y asesorías</li>
                      <li>Creación de conciliaciones</li>
                      <li>Vista de reportes básicos</li>
                    </>
                  )}
                  {usuario.role.nombre === 'ABOGADO' && (
                    <>
                      <li>Gestión completa de casos</li>
                      <li>Actuaciones y audiencias</li>
                      <li>Documentos legales</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Estado del Usuario */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Estado del Usuario</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2">
                {usuario.activo ? (
                  <>
                    <UserCheck size={20} className="text-success" />
                    <div>
                      <div className="fw-semibold text-success">Usuario Activo</div>
                      <div className="small text-muted">Puede acceder al sistema</div>
                    </div>
                  </>
                ) : (
                  <>
                    <UserX size={20} className="text-secondary" />
                    <div>
                      <div className="fw-semibold text-secondary">Usuario Inactivo</div>
                      <div className="small text-muted">No puede acceder al sistema</div>
                    </div>
                  </>  
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
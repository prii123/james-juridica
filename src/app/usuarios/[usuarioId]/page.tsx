'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
  Edit3,
  Mail,
  Phone,
  CreditCard,
  Shield,
  Calendar,
  UserCheck,
  UserX,
  Key,
  Activity
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Spinner, type BadgeProps } from '@/components/ui'

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

const ROLE_BADGE: Record<string, BadgeProps['variant']> = {
  ADMIN: 'danger',
  ASESOR: 'primary',
  ABOGADO: 'success',
  ASISTENTE: 'info',
}

const ROLE_ICON_COLOR: Record<string, string> = {
  ADMIN: 'text-red-600',
  ASESOR: 'text-blue-800',
  ABOGADO: 'text-teal-700',
  ASISTENTE: 'text-sky-700',
}

export default function UsuarioDetailPage({ params }: { params: { usuarioId: string } }) {
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

  if (loading) {
    return <Spinner />
  }

  if (error || !usuario) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">{error || 'Usuario no encontrado'}</Alert>
        <Link href="/usuarios"><Button>Volver a Usuarios</Button></Link>
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

      <div className="mb-4 flex items-center gap-3">
        <Link href="/usuarios">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-800 text-white">
              {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
            </div>
            <div>
              <h1 className="mb-0 text-xl font-bold text-slate-800">
                {usuario.nombre} {usuario.apellido}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant={ROLE_BADGE[usuario.role.nombre] || 'secondary'}>{usuario.role.nombre}</Badge>
                <Badge variant={usuario.activo ? 'success' : 'secondary'}>
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Link href={`/usuarios/${params.usuarioId}/editar`}>
          <Button variant="outlinePrimary">
            <Edit3 size={16} />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {/* Información Personal */}
          <Card>
            <CardHeader><CardTitle>Información Personal</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Mail size={16} className="text-slate-400" />
                      <span className="font-semibold text-slate-500">Correo Electrónico</span>
                    </div>
                    <div>{usuario.email}</div>
                  </div>

                  {usuario.telefono && (
                    <div className="mb-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Phone size={16} className="text-slate-400" />
                        <span className="font-semibold text-slate-500">Teléfono</span>
                      </div>
                      <div>{usuario.telefono}</div>
                    </div>
                  )}
                </div>
                <div>
                  {usuario.documento && (
                    <div className="mb-3">
                      <div className="mb-2 flex items-center gap-2">
                        <CreditCard size={16} className="text-slate-400" />
                        <span className="font-semibold text-slate-500">Documento</span>
                      </div>
                      <div>{usuario.documento}</div>
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Shield size={16} className="text-slate-400" />
                      <span className="font-semibold text-slate-500">Rol del Sistema</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ROLE_BADGE[usuario.role.nombre] || 'secondary'}>{usuario.role.nombre}</Badge>
                      <span className="text-slate-500">{usuario.role.descripcion}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Histórico de Actividad */}
          <Card>
            <CardHeader><CardTitle>Registros del Sistema</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-500">Creado</span>
                  </div>
                  <div>{formatDate(usuario.createdAt)}</div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Activity size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-500">Última Actualización</span>
                  </div>
                  <div>{formatDate(usuario.updatedAt)}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          {/* Acciones */}
          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardBody className="grid gap-2">
              <Link href={`/usuarios/${params.usuarioId}/editar`}>
                <Button className="w-full justify-center">
                  <Edit3 size={16} />
                  Editar Usuario
                </Button>
              </Link>

              <Button
                variant="outline"
                className={usuario.activo ? 'justify-center border-amber-500 text-amber-600 hover:bg-amber-50' : 'justify-center border-teal-700 text-teal-700 hover:bg-teal-50'}
                onClick={handleStatusToggle}
                loading={updating}
              >
                {!updating && (usuario.activo ? <UserX size={16} /> : <UserCheck size={16} />)}
                {updating ? 'Actualizando...' : usuario.activo ? 'Desactivar Usuario' : 'Activar Usuario'}
              </Button>

              <Button
                variant="outline"
                className="justify-center"
                onClick={() => {
                  alert('Funcionalidad de reset de contraseña por implementar')
                }}
              >
                <Key size={16} />
                Restablecer Contraseña
              </Button>
            </CardBody>
          </Card>

          {/* Información del Rol */}
          <Card>
            <CardHeader><CardTitle>Rol y Permisos</CardTitle></CardHeader>
            <CardBody>
              <div className="mb-3 flex items-center gap-2">
                <Shield size={20} className={ROLE_ICON_COLOR[usuario.role.nombre] || 'text-slate-500'} />
                <div>
                  <div className="font-semibold text-slate-800">{usuario.role.nombre}</div>
                  <div className="text-sm text-slate-500">{usuario.role.descripcion}</div>
                </div>
              </div>

              <div className="text-sm text-slate-500">
                <strong>Permisos del rol:</strong>
                <ul className="mt-2 list-disc space-y-1 pl-5">
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
                      <li>Creación de radicaciones</li>
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
            </CardBody>
          </Card>

          {/* Estado del Usuario */}
          <Card>
            <CardHeader><CardTitle>Estado del Usuario</CardTitle></CardHeader>
            <CardBody>
              <div className="flex items-center gap-2">
                {usuario.activo ? (
                  <>
                    <UserCheck size={20} className="text-teal-700" />
                    <div>
                      <div className="font-semibold text-teal-700">Usuario Activo</div>
                      <div className="text-sm text-slate-500">Puede acceder al sistema</div>
                    </div>
                  </>
                ) : (
                  <>
                    <UserX size={20} className="text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-500">Usuario Inactivo</div>
                      <div className="text-sm text-slate-500">No puede acceder al sistema</div>
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User, Mail, Shield, Lock } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Label, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

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

      const [usuarioResponse, rolesResponse] = await Promise.all([
        fetch(`/api/usuarios/${params.usuarioId}`),
        fetch('/api/roles')
      ])

      if (usuarioResponse.ok) {
        const usuarioData = await usuarioResponse.json()
        setUsuario(usuarioData)

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

    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  if (loadingData) {
    return <Spinner />
  }

  if (!usuario) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">Usuario no encontrado</Alert>
        <Link href="/usuarios"><Button>Volver a Usuarios</Button></Link>
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

      <div className="mb-4 flex items-center gap-3">
        <Link href={`/usuarios/${params.usuarioId}`}>
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Editar Usuario</h1>
          <p className="mb-0 text-slate-500">
            Modificar información de {usuario.nombre} {usuario.apellido}
          </p>
        </div>
      </div>

      {errors.general && (
        <Alert variant="danger" className="mb-4">{errors.general}</Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card>
              <CardHeader><CardTitle>Información Personal</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                {/* Nombre y Apellido */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Nombre *</Label>
                    <Input
                      type="text"
                      className={cn(errors.nombre && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      placeholder="Nombre del usuario"
                      required
                    />
                    {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Apellido *</Label>
                    <Input
                      type="text"
                      className={cn(errors.apellido && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.apellido}
                      onChange={(e) => handleInputChange('apellido', e.target.value)}
                      placeholder="Apellido del usuario"
                      required
                    />
                    {errors.apellido && <p className="mt-1 text-xs text-red-600">{errors.apellido}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label className="font-semibold">Correo Electrónico *</Label>
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      className={cn('pl-9', errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="usuario@empresa.com"
                      required
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Documento y Teléfono */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Documento</Label>
                    <Input
                      type="text"
                      className={cn(errors.documento && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.documento}
                      onChange={(e) => handleInputChange('documento', e.target.value)}
                      placeholder="Número de identificación"
                    />
                    {errors.documento && <p className="mt-1 text-xs text-red-600">{errors.documento}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Teléfono</Label>
                    <Input
                      type="tel"
                      className={cn(errors.telefono && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      placeholder="Número de teléfono"
                    />
                    {errors.telefono && <p className="mt-1 text-xs text-red-600">{errors.telefono}</p>}
                  </div>
                </div>

                {/* Rol */}
                <div>
                  <Label className="font-semibold">Rol del Usuario *</Label>
                  <div className="relative">
                    <Shield size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Select
                      className={cn('pl-9', errors.roleId && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
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
                    </Select>
                  </div>
                  {errors.roleId && <p className="mt-1 text-xs text-red-600">{errors.roleId}</p>}
                </div>

                {/* Estado */}
                <div>
                  <label htmlFor="activo" className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="activo"
                      className="h-4 w-4 accent-blue-800"
                      checked={formData.activo}
                      onChange={(e) => handleInputChange('activo', e.target.checked)}
                    />
                    <span className="font-semibold text-slate-800">Usuario Activo</span>
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    Los usuarios inactivos no podrán acceder al sistema
                  </p>
                </div>

                {/* Cambio de Contraseña */}
                <hr className="border-slate-200" />
                <h6 className="font-semibold text-slate-700">Cambio de Contraseña</h6>

                <label htmlFor="changePassword" className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="changePassword"
                    className="h-4 w-4 accent-blue-800"
                    checked={formData.changePassword}
                    onChange={(e) => handleInputChange('changePassword', e.target.checked)}
                  />
                  <span className="text-sm text-slate-700">Cambiar contraseña del usuario</span>
                </label>

                {formData.changePassword && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label className="font-semibold">Nueva Contraseña *</Label>
                      <div className="relative">
                        <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="password"
                          className={cn('pl-9', errors.newPassword && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                          value={formData.newPassword}
                          onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          required
                          minLength={8}
                        />
                      </div>
                      {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>}
                    </div>
                    <div>
                      <Label className="font-semibold">Confirmar Nueva Contraseña *</Label>
                      <div className="relative">
                        <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="password"
                          className={cn('pl-9', errors.confirmPassword && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Repetir nueva contraseña"
                          required
                        />
                      </div>
                      {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <Card>
              <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
              <CardBody className="grid gap-2">
                <Button type="submit" loading={loading} className="justify-center">
                  {!loading && <Save size={16} />}
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Link href={`/usuarios/${params.usuarioId}`}>
                  <Button type="button" variant="outline" className="w-full justify-center">Cancelar</Button>
                </Link>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Usuario Actual</CardTitle></CardHeader>
              <CardBody>
                <div className="mb-2 flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <span className="font-semibold text-slate-800">{usuario.nombre} {usuario.apellido}</span>
                </div>
                <div className="space-y-1 text-sm text-slate-500">
                  <div>Email: {usuario.email}</div>
                  <div className="flex items-center gap-1">Rol: <Badge variant="primary">{usuario.role.nombre}</Badge></div>
                  <div className="flex items-center gap-1">
                    Estado: <Badge variant={usuario.activo ? 'success' : 'secondary'}>{usuario.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}

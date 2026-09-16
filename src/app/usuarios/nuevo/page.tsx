'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Mail, Lock, Shield } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Label, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

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

    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  if (loadingData) {
    return <Spinner />
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Usuarios', href: '/usuarios' },
          { label: 'Nuevo Usuario' }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/usuarios">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Nuevo Usuario</h1>
          <p className="mb-0 text-slate-500">Crear un nuevo usuario del sistema</p>
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

                {/* Contraseñas */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Contraseña *</Label>
                    <div className="relative">
                      <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="password"
                        className={cn('pl-9', errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        required
                        minLength={8}
                      />
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Confirmar Contraseña *</Label>
                    <div className="relative">
                      <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="password"
                        className={cn('pl-9', errors.confirmPassword && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Repetir contraseña"
                        required
                      />
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                  </div>
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
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <Card>
              <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
              <CardBody>
                <div className="grid gap-2">
                  <Button type="submit" loading={loading} className="justify-center">
                    {!loading && <Save size={16} />}
                    {loading ? 'Creando Usuario...' : 'Crear Usuario'}
                  </Button>
                  <Link href="/usuarios">
                    <Button type="button" variant="outline" className="w-full justify-center">Cancelar</Button>
                  </Link>
                </div>

                <hr className="my-4 border-slate-200" />

                <div className="text-sm text-slate-500">
                  <h6 className="mb-2 font-semibold text-slate-700">Información:</h6>
                  <ul className="list-none space-y-1 p-0">
                    <li>• Los campos marcados con * son obligatorios</li>
                    <li>• La contraseña debe tener mínimo 8 caracteres</li>
                    <li>• El rol determinará los permisos del usuario</li>
                    <li>• Se enviará un email de bienvenida al usuario</li>
                  </ul>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Roles Disponibles</CardTitle></CardHeader>
              <CardBody className="space-y-2 text-sm">
                {roles.map((rol) => (
                  <div key={rol.id}>
                    <strong>{rol.nombre}:</strong> {rol.descripcion}
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}

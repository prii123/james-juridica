'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Key, AlertTriangle } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Textarea, Label, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface EditRoleData {
  nombre: string
  descripcion: string
  permissionIds: string[]
}

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

export default function EditRolePage() {
  const params = useParams()
  const router = useRouter()
  const roleId = params.roleId as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [role, setRole] = useState<Role | null>(null)

  const [formData, setFormData] = useState<EditRoleData>({
    nombre: '',
    descripcion: '',
    permissionIds: []
  })

  useEffect(() => {
    if (roleId) {
      fetchData()
    }
  }, [roleId])

  const fetchData = async () => {
    try {
      setLoadingData(true)

      const permissionsResponse = await fetch('/api/permissions')
      const permissionsData = await permissionsResponse.json()

      const rolesResponse = await fetch('/api/roles?includePermissions=true')
      const rolesData = await rolesResponse.json()
      const currentRole = rolesData.find((r: Role) => r.id === roleId)

      if (permissionsResponse.ok && rolesResponse.ok && currentRole) {
        setPermissions(permissionsData)
        setRole(currentRole)

        setFormData({
          nombre: currentRole.nombre,
          descripcion: currentRole.descripcion || '',
          permissionIds: currentRole.permissions.map((p: Permission) => p.id)
        })
      } else {
        console.error('Error al cargar los datos')
        router.push('/usuarios/permisos')
      }
    } catch (error) {
      console.error('Error al cargar los datos:', error)
      router.push('/usuarios/permisos')
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

      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      })

      if (response.ok) {
        router.push(`/usuarios/permisos/roles/${roleId}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.error || 'Error al actualizar el rol' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof EditRoleData, value: string | string[]) => {
    setFormData({ ...formData, [field]: value })

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

    const allSelected = modulePermissionIds.every(id => currentPermissions.includes(id))

    if (allSelected) {
      handleInputChange('permissionIds', currentPermissions.filter(id => !modulePermissionIds.includes(id)))
    } else {
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

  const hasChanges = () => {
    if (!role) return false

    return (
      formData.nombre !== role.nombre ||
      formData.descripcion !== (role.descripcion || '') ||
      JSON.stringify([...formData.permissionIds].sort()) !==
      JSON.stringify([...role.permissions.map(p => p.id)].sort())
    )
  }

  if (loadingData) {
    return <Spinner />
  }

  if (!role) {
    return (
      <div className="py-5 text-center">
        <Alert variant="warning">No se encontró el rol especificado</Alert>
      </div>
    )
  }

  const permisosDiff = formData.permissionIds.length - role.permissions.length

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Usuarios', href: '/usuarios' },
          { label: 'Permisos y Roles', href: '/usuarios/permisos' },
          { label: role.nombre, href: `/usuarios/permisos/roles/${role.id}` },
          { label: 'Editar' }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href={`/usuarios/permisos/roles/${roleId}`}>
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Editar Rol: {role.nombre}</h1>
          <p className="mb-0 text-slate-500">Modificar los permisos y configuración del rol</p>
        </div>
      </div>

      {errors.general && (
        <Alert variant="danger" className="mb-4">{errors.general}</Alert>
      )}

      {role._count.usuarios > 0 && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle size={16} className="mr-1 inline" />
          <strong>Atención:</strong> Este rol está asignado a {role._count.usuarios} usuario(s).
          Los cambios en los permisos afectarán inmediatamente a todos los usuarios con este rol.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Card>
              <CardHeader><CardTitle>Información del Rol</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <Label className="font-semibold">Nombre del Rol *</Label>
                  <Input
                    type="text"
                    className={cn(errors.nombre && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Ej: ASESOR, ABOGADO, ADMIN"
                    required
                  />
                  {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
                  <p className="mt-1 text-xs text-slate-500">
                    Use nombres en mayúsculas y descriptivos (ADMIN, ASESOR, ABOGADO, etc.)
                  </p>
                </div>

                <div>
                  <Label className="font-semibold">Descripción</Label>
                  <Textarea
                    className={cn(errors.descripcion && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción del rol y sus responsabilidades..."
                  />
                  {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion}</p>}
                </div>
              </CardBody>
            </Card>

            {/* Permisos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key size={20} />
                  Permisos del Rol ({formData.permissionIds.length} seleccionados)
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {getModules().map((modulo) => {
                  const modulePermissions = getPermissionsByModule(modulo)
                  const fullySelected = isModuleFullySelected(modulo)
                  const partiallySelected = isModulePartiallySelected(modulo)

                  return (
                    <div key={modulo}>
                      <div className="mb-3 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`module-${modulo}`}
                          className="h-4 w-4 accent-blue-800"
                          checked={fullySelected}
                          ref={(el) => {
                            if (el) el.indeterminate = partiallySelected
                          }}
                          onChange={() => handleModuleToggle(modulo)}
                        />
                        <label htmlFor={`module-${modulo}`} className="font-bold text-blue-800">
                          {modulo.toUpperCase()}
                        </label>
                        <Badge variant="outline" className="ml-auto">
                          {modulePermissions.filter(p => formData.permissionIds.includes(p.id)).length} / {modulePermissions.length}
                        </Badge>
                      </div>

                      <div className="ml-6 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {modulePermissions.map((permission) => (
                          <label key={permission.id} htmlFor={`permission-${permission.id}`} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              id={`permission-${permission.id}`}
                              className="mt-1 h-4 w-4 accent-blue-800"
                              checked={formData.permissionIds.includes(permission.id)}
                              onChange={() => handlePermissionToggle(permission.id)}
                            />
                            <span>
                              <span className="block font-semibold text-slate-800">{permission.nombre}</span>
                              {permission.descripcion && (
                                <span className="block text-sm text-slate-500">{permission.descripcion}</span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <Card>
              <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
              <CardBody>
                <div className="grid gap-2">
                  <Button type="submit" loading={loading} disabled={!hasChanges()} className="justify-center">
                    {!loading && <Save size={16} />}
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Link href={`/usuarios/permisos/roles/${roleId}`}>
                    <Button type="button" variant="outline" className="w-full justify-center">Cancelar</Button>
                  </Link>
                </div>

                {!hasChanges() && (
                  <Alert variant="info" className="mt-3 py-2 text-sm">
                    No hay cambios para guardar
                  </Alert>
                )}

                <hr className="my-4 border-slate-200" />

                <div className="text-sm text-slate-500">
                  <h6 className="mb-2 font-semibold text-slate-700">Cambios:</h6>
                  <ul className="list-none space-y-1 p-0">
                    <li>• <strong>Rol:</strong> {formData.nombre || 'Sin nombre'}</li>
                    <li>
                      • <strong>Permisos:</strong> {formData.permissionIds.length}
                      {' '}
                      <span className={cn(
                        permisosDiff > 0 ? 'text-teal-700' : permisosDiff < 0 ? 'text-amber-600' : 'text-slate-500'
                      )}>
                        ({permisosDiff > 0 ? '+' : ''}{permisosDiff})
                      </span>
                    </li>
                    <li>• <strong>Módulos:</strong> {
                      getModules().filter(modulo =>
                        getPermissionsByModule(modulo).some(p =>
                          formData.permissionIds.includes(p.id)
                        )
                      ).length
                    }</li>
                    <li>• <strong>Usuarios afectados:</strong> {role._count.usuarios}</li>
                  </ul>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Información</CardTitle></CardHeader>
              <CardBody className="text-sm text-slate-500">
                <ul className="list-none space-y-1 p-0">
                  <li>• Los cambios se aplican inmediatamente</li>
                  <li>• Los usuarios con este rol verán los cambios en su próximo inicio de sesión</li>
                  <li>• Puede seleccionar módulos completos o permisos individuales</li>
                  <li>• El nombre del rol debe ser único en el sistema</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}

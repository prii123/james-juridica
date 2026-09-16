'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  Plus,
  Search,
  Filter,
  User,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Edit3,
  Users
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Alert, Spinner, type BadgeProps } from '@/components/ui'

interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  activo: boolean
  role: {
    nombre: string
  }
}

const ROLE_BADGE: Record<string, BadgeProps['variant']> = {
  ADMIN: 'danger',
  ASESOR: 'primary',
  ABOGADO: 'success',
  ASISTENTE: 'info',
}

export default function UsuariosPage() {
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([])
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    admins: 0,
    asesores: 0,
    abogados: 0
  })

  useEffect(() => {
    fetchUsuarios()
  }, [])

  useEffect(() => {
    calculateStats()
    filterUsuarios()
  }, [usuarios, searchTerm, roleFilter, estadoFilter])

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/usuarios')

      if (response.ok) {
        const data = await response.json()
        setUsuarios(data.usuarios || [])
      } else {
        setError('Error al cargar usuarios')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (!Array.isArray(usuarios)) return

    const total = usuarios.length
    const activos = usuarios.filter(u => u.activo).length
    const inactivos = usuarios.filter(u => !u.activo).length
    const admins = usuarios.filter(u => u.role?.nombre === 'ADMIN').length
    const asesores = usuarios.filter(u => u.role?.nombre === 'ASESOR').length
    const abogados = usuarios.filter(u => u.role?.nombre === 'ABOGADO').length

    setStats({
      total,
      activos,
      inactivos,
      admins,
      asesores,
      abogados
    })
  }

  const filterUsuarios = () => {
    if (!Array.isArray(usuarios)) return

    let filtered = usuarios

    if (searchTerm) {
      filtered = filtered.filter(usuario =>
        usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter) {
      filtered = filtered.filter(usuario => usuario.role?.nombre === roleFilter)
    }

    if (estadoFilter) {
      if (estadoFilter === 'activo') {
        filtered = filtered.filter(usuario => usuario.activo)
      } else if (estadoFilter === 'inactivo') {
        filtered = filtered.filter(usuario => !usuario.activo)
      }
    }

    setFilteredUsuarios(filtered)
  }

  if (loading) {
    return <Spinner />
  }

  const statCards: Array<{ icon: typeof Users; value: number; label: string; bg: string }> = [
    { icon: Users, value: stats.total, label: 'Total Usuarios', bg: 'bg-blue-800' },
    { icon: UserCheck, value: stats.activos, label: 'Activos', bg: 'bg-teal-700' },
    { icon: UserX, value: stats.inactivos, label: 'Inactivos', bg: 'bg-slate-500' },
    { icon: Shield, value: stats.admins, label: 'Administradores', bg: 'bg-red-600' },
    { icon: User, value: stats.asesores, label: 'Asesores', bg: 'bg-sky-600' },
    { icon: User, value: stats.abogados, label: 'Abogados', bg: 'bg-amber-500' },
  ]

  return (
    <>
      <Breadcrumb items={[{ label: 'Usuarios' }]} />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="mb-0 text-slate-500">Administra usuarios del sistema</p>
        </div>
        <div className="flex gap-2">
          <Link href="/usuarios/permisos">
            <Button variant="outlinePrimary">
              <Shield size={16} />
              Permisos y Roles
            </Button>
          </Link>
          <Link href="/usuarios/nuevo">
            <Button>
              <Plus size={16} />
              Nuevo Usuario
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className={`${stat.bg} border-0 text-white`}>
            <CardBody>
              <div className="flex items-center">
                <stat.icon size={24} className="mr-3" />
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm">{stat.label}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                className="pl-9"
                placeholder="Buscar por nombre, apellido o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">Todos los roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="ASESOR">Asesor</option>
                <option value="ABOGADO">Abogado</option>
                <option value="ASISTENTE">Asistente</option>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => { setSearchTerm(''); setRoleFilter(''); setEstadoFilter('') }}
              >
                <Filter size={16} />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsuarios.length} de {stats.total})</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {filteredUsuarios.length === 0 ? (
            <div className="py-5 text-center">
              <Users size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Usuario</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Rol</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-800 text-xs text-white">
                            {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                          </div>
                          <div className="font-semibold text-slate-800">
                            {usuario.nombre} {usuario.apellido}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail size={14} />
                          {usuario.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge variant={ROLE_BADGE[usuario.role?.nombre || ''] || 'secondary'}>
                          {usuario.role?.nombre || 'Sin Rol'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge variant={usuario.activo ? 'success' : 'secondary'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                        <div className="flex justify-end gap-1">
                          <Link href={`/usuarios/${usuario.id}`}>
                            <Button variant="outlinePrimary" size="icon" title="Ver detalles">
                              <User size={14} />
                            </Button>
                          </Link>
                          <Link href={`/usuarios/${usuario.id}/editar`}>
                            <Button variant="outline" size="icon" title="Editar usuario">
                              <Edit3 size={14} />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}

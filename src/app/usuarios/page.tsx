'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function UsuariosPage() {
  const router = useRouter()
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

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(usuario =>
        usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por rol
    if (roleFilter) {
      filtered = filtered.filter(usuario => usuario.role?.nombre === roleFilter)
    }

    // Filtro por estado
    if (estadoFilter) {
      if (estadoFilter === 'activo') {
        filtered = filtered.filter(usuario => usuario.activo)
      } else if (estadoFilter === 'inactivo') {
        filtered = filtered.filter(usuario => !usuario.activo)
      }
    }

    setFilteredUsuarios(filtered)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
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

  return (
    <>
      <Breadcrumb items={[{ label: 'Usuarios' }]} />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Gestión de Usuarios</h1>
          <p className="text-secondary mb-0">Administra usuarios del sistema</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/usuarios/permisos" className="btn btn-outline-primary d-flex align-items-center gap-2">
            <Shield size={16} />
            Permisos y Roles
          </Link>
          <Link href="/usuarios/nuevo" className="btn btn-primary d-flex align-items-center gap-2">
            <Plus size={16} />
            Nuevo Usuario
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <Users size={24} className="me-3" />
                <div>
                  <div className="fs-2 fw-bold">{stats.total}</div>
                  <div className="small">Total Usuarios</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <UserCheck size={24} className="me-3" />
                <div>
                  <div className="fs-2 fw-bold">{stats.activos}</div>
                  <div className="small">Activos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card bg-secondary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <UserX size={24} className="me-3" />
                <div>
                  <div className="fs-2 fw-bold">{stats.inactivos}</div>
                  <div className="small">Inactivos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <Shield size={24} className="me-3" />
                <div>
                  <div className="fs-2 fw-bold">{stats.admins}</div>
                  <div className="small">Administradores</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <User size={24} className="me-3" />
                <div>
                  <div className="fs-2 fw-bold">{stats.asesores}</div>
                  <div className="small">Asesores</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <User size={24} className="me-3" />
                <div>
                  <div className="fs-2 fw-bold">{stats.abogados}</div>
                  <div className="small">Abogados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre, apellido o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Todos los roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="ASESOR">Asesor</option>
                <option value="ABOGADO">Abogado</option>
                <option value="ASISTENTE">Asistente</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setRoleFilter('')
                  setEstadoFilter('')
                }}
                className="btn btn-outline-secondary w-100"
              >
                <Filter size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Usuarios ({filteredUsuarios.length} de {stats.total})
          </h5>
        </div>
        <div className="card-body p-0">
          {filteredUsuarios.length === 0 ? (
            <div className="text-center py-5">
              <Users size={48} className="text-muted mb-3" />
              <p className="text-muted">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px', fontSize: '12px'}}>
                            {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-semibold">
                              {usuario.nombre} {usuario.apellido}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2 text-muted">
                          <Mail size={14} />
                          {usuario.email}
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${getRoleBadgeColor(usuario.role?.nombre || 'USUARIO')}`}>
                          {usuario.role?.nombre || 'Sin Rol'}
                        </span>
                      </td>
                      <td>
                        {usuario.activo ? (
                          <span className="badge bg-success">Activo</span>
                        ) : (
                          <span className="badge bg-secondary">Inactivo</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link
                            href={`/usuarios/${usuario.id}`}
                            className="btn btn-outline-primary"
                            title="Ver detalles"
                          >
                            <User size={14} />
                          </Link>
                          <Link
                            href={`/usuarios/${usuario.id}/editar`}
                            className="btn btn-outline-secondary"
                            title="Editar usuario"
                          >
                            <Edit3 size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
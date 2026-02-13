'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { Users, Plus, Search, Filter, Eye, Edit, Phone, Mail } from 'lucide-react'
import { EstadoLead, TipoPersona } from '@prisma/client'

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa?: string | null
  tipoPersona: TipoPersona
  estado: EstadoLead
  origen?: string | null
  fechaSeguimiento?: Date | null
  createdAt: Date
  responsable?: {
    nombre: string
    apellido: string
  } | null
}

interface LeadsFilters {
  estado?: EstadoLead
  tipoPersona?: TipoPersona
  search?: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<LeadsFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50
  })

  useEffect(() => {
    fetchLeads()
  }, [filters])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      const queryParams = new URLSearchParams()
      
      if (filters.estado) queryParams.append('estado', filters.estado)
      if (filters.tipoPersona) queryParams.append('tipoPersona', filters.tipoPersona)
      if (filters.search) queryParams.append('search', filters.search)
      
      const response = await fetch(`/api/leads?${queryParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        // Handle both array response (old format) and object response (new format)
        if (Array.isArray(data)) {
          setLeads(data)
          setPagination({ total: data.length, page: 1, limit: 50 })
        } else if (data.leads && Array.isArray(data.leads)) {
          setLeads(data.leads)
          setPagination({
            total: data.total || data.leads.length,
            page: data.page || 1,
            limit: data.limit || 50
          })
        } else {
          console.error('Unexpected API response format:', data)
          setLeads([])
          setError('Formato de respuesta inesperado del servidor')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al cargar los leads')
        setLeads([])
      }
    } catch (error) {
      console.error('Error al cargar leads:', error)
      setError('Error de conexión. Por favor, inténtelo de nuevo.')
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadgeClass = (estado: EstadoLead) => {
    switch (estado) {
      case 'NUEVO': return 'badge bg-primary'
      case 'CONTACTADO': return 'badge bg-info'
      case 'CALIFICADO': return 'badge bg-warning'
      case 'CONVERTIDO': return 'badge bg-success'
      case 'PERDIDO': return 'badge bg-danger'
      default: return 'badge bg-secondary'
    }
  }

  const getTipoPersonaText = (tipo: TipoPersona) => {
    return tipo === 'NATURAL' ? 'Natural' : 'Jurídica'
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Leads' }
        ]} 
      />
      
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h1 className="h2 fw-bold text-dark mb-2">Leads</h1>
            <p className="text-secondary mb-0">Gestión de prospectos y oportunidades comerciales</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link href="/leads/nuevo" className="btn btn-primary d-flex align-items-center gap-2">
              <Plus size={16} />
              Nuevo Lead
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card">
          <div className="card-body p-3">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar leads..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6 text-end">
                <button 
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} />
                  Filtros
                </button>
              </div>
            </div>
            
            {showFilters && (
              <div className="row mt-3">
                <div className="col-md-4">
                  <select 
                    className="form-select"
                    value={filters.estado || ''}
                    onChange={(e) => setFilters({ ...filters, estado: e.target.value as EstadoLead || undefined })}
                  >
                    <option value="">Todos los estados</option>
                    <option value="NUEVO">Nuevo</option>
                    <option value="CONTACTADO">Contactado</option>
                    <option value="CALIFICADO">Calificado</option>
                    <option value="CONVERTIDO">Convertido</option>
                    <option value="PERDIDO">Perdido</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <select 
                    className="form-select"
                    value={filters.tipoPersona || ''}
                    onChange={(e) => setFilters({ ...filters, tipoPersona: e.target.value as TipoPersona || undefined })}
                  >
                    <option value="">Todos los tipos</option>
                    <option value="NATURAL">Persona Natural</option>
                    <option value="JURIDICA">Persona Jurídica</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <button 
                    className="btn btn-outline-danger w-100"
                    onClick={() => setFilters({})}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Lista de Leads</h5>
            <span className="badge bg-primary">
              {pagination.total > 0 ? pagination.total : leads.length} leads
            </span>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <div className="alert alert-danger mx-4" role="alert">
                <h6 className="alert-heading">Error al cargar leads</h6>
                {error}
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setError(null)
                  fetchLeads()
                }}
              >
                Reintentar
              </button>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <Users size={48} className="text-muted" />
              </div>
              <h5>No hay leads</h5>
              <p className="text-muted">No se encontraron leads que coincidan con los filtros seleccionados.</p>
              <Link href="/leads/nuevo" className="btn btn-primary">
                Crear primer lead
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Empresa</th>
                    <th>Contacto</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <Link href={`/leads/${lead.id}`} className="text-decoration-none fw-semibold">
                          {lead.nombre}
                        </Link>
                      </td>
                      <td>{lead.empresa || '-'}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <small className="d-flex align-items-center gap-1">
                            <Mail size={12} />
                            {lead.email}
                          </small>
                          <small className="d-flex align-items-center gap-1">
                            <Phone size={12} />
                            {lead.telefono}
                          </small>
                        </div>
                      </td>
                      <td>{getTipoPersonaText(lead.tipoPersona)}</td>
                      <td>
                        <span className={getEstadoBadgeClass(lead.estado)}>
                          {lead.estado}
                        </span>
                      </td>
                      <td>
                        {lead.responsable ? 
                          `${lead.responsable.nombre} ${lead.responsable.apellido}` : 
                          <span className="text-muted">Sin asignar</span>
                        }
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Link 
                            href={`/leads/${lead.id}`}
                            className="btn btn-outline-primary btn-sm"
                            title="Ver detalles"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link 
                            href={`/leads/${lead.id}/editar`}
                            className="btn btn-outline-secondary btn-sm"
                            title="Editar"
                          >
                            <Edit size={14} />
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
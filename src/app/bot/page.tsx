'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import CopiarLeadModal, { LeadBorrador } from '@/components/CopiarLeadModal'
import { Bot, Search, Filter, Eye, Copy, Phone, Mail, MapPin, MessageCircle, UserCheck, Users } from 'lucide-react'
import { ETAPAS_COMERCIALES, etapaInfo, label, labelRangoDinero } from '@/modules/bot/labels'

interface CasoBot {
  id: string
  situacion: string | null
  rango_deuda: string | null
  num_acreedores: string | null
  etapa_comercial: string
  abogado_asignado: string | null
  notas: string | null
}

interface ContactoBot {
  id: string
  telefono: string
  nombre_perfil: string | null
  nombre: string | null
  email: string | null
  tipo_persona: string | null
  ciudad: string | null
  documento: string | null
  estado_conversacion: string
  ultimo_mensaje_at: string | null
  created_at: string
  caso: CasoBot | null
  totalMensajes: number
}

interface Stats {
  total: number
  esperandoHumano: number
  porEtapa: Record<string, number>
  estadosConversacion: Array<{ value: string; count: number }>
}

interface Filters {
  search?: string
  etapa?: string
  estadoConversacion?: string
}

export default function BotPage() {
  const [contactos, setContactos] = useState<ContactoBot[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)
  const [copiando, setCopiando] = useState<{ contactoId: string; borrador: LeadBorrador } | null>(null)
  const [cargandoBorrador, setCargandoBorrador] = useState<string | null>(null)

  const fetchContactos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.etapa) params.append('etapa', filters.etapa)
      if (filters.estadoConversacion) params.append('estadoConversacion', filters.estadoConversacion)

      const res = await fetch(`/api/bot?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al cargar los contactos del bot')
        setContactos([])
        return
      }
      setContactos(data.contactos || [])
      setTotal(data.total || 0)
    } catch {
      setError('Error de conexión. Por favor, inténtelo de nuevo.')
      setContactos([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/stats')
      if (res.ok) setStats(await res.json())
    } catch {
      // Las estadísticas no son críticas
    }
  }, [])

  useEffect(() => {
    fetchContactos()
  }, [fetchContactos])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const abrirCopiar = async (contactoId: string) => {
    try {
      setCargandoBorrador(contactoId)
      const res = await fetch(`/api/bot/${contactoId}`)
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'No se pudo cargar el contacto')
        return
      }
      if (data.leadExistente) {
        const ir = confirm(`Este contacto ya existe en Leads como "${data.leadExistente.nombre}". ¿Desea crear otro de todas formas?`)
        if (!ir) return
      }
      setCopiando({ contactoId, borrador: data.leadBorrador })
    } catch {
      alert('Error de conexión')
    } finally {
      setCargandoBorrador(null)
    }
  }

  const nombreContacto = (c: ContactoBot) => c.nombre || c.nombre_perfil || 'Sin nombre'

  const fechaRelativa = (iso: string | null) => {
    if (!iso) return '-'
    const d = new Date(iso)
    const diffMin = Math.round((Date.now() - d.getTime()) / 60000)
    if (diffMin < 1) return 'Ahora'
    if (diffMin < 60) return `Hace ${diffMin} min`
    const diffH = Math.round(diffMin / 60)
    if (diffH < 24) return `Hace ${diffH} h`
    const diffD = Math.round(diffH / 24)
    if (diffD < 7) return `Hace ${diffD} d`
    return d.toLocaleDateString()
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Bot' }]} />

      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h1 className="h2 fw-bold text-dark mb-2 d-flex align-items-center gap-2">
              <Bot size={28} />
              Bot WhatsApp
            </h1>
            <p className="text-secondary mb-0">Contactos captados por el chatbot: seguimiento comercial y copia a Leads</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="row g-3 mb-3">
            <div className="col-6 col-md-3">
              <div className="card h-100" style={{ borderLeft: '4px solid #1e40af' }}>
                <div className="card-body py-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Users size={16} style={{ color: '#1e40af' }} />
                    <span className="text-muted text-uppercase small">Contactos</span>
                  </div>
                  <h3 className="fw-bold mb-0" style={{ color: '#1e40af' }}>{stats.total}</h3>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card h-100" style={{ borderLeft: '4px solid #dc2626' }}>
                <div className="card-body py-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <UserCheck size={16} style={{ color: '#dc2626' }} />
                    <span className="text-muted text-uppercase small">Esperando abogado</span>
                  </div>
                  <h3 className="fw-bold mb-0" style={{ color: '#dc2626' }}>{stats.esperandoHumano}</h3>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card h-100" style={{ borderLeft: '4px solid #0369a1' }}>
                <div className="card-body py-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <MessageCircle size={16} style={{ color: '#0369a1' }} />
                    <span className="text-muted text-uppercase small">Nuevos</span>
                  </div>
                  <h3 className="fw-bold mb-0" style={{ color: '#0369a1' }}>{stats.porEtapa.nuevo ?? 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card h-100" style={{ borderLeft: '4px solid #0f766e' }}>
                <div className="card-body py-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Copy size={16} style={{ color: '#0f766e' }} />
                    <span className="text-muted text-uppercase small">Convertidos</span>
                  </div>
                  <h3 className="fw-bold mb-0" style={{ color: '#0f766e' }}>{stats.porEtapa.convertido ?? 0}</h3>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    placeholder="Buscar por nombre, teléfono, email, documento o ciudad..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6 text-end">
                <button
                  className="btn btn-outline-secondary d-flex align-items-center gap-2 ms-auto"
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
                    value={filters.etapa || ''}
                    onChange={(e) => setFilters({ ...filters, etapa: e.target.value || undefined })}
                  >
                    <option value="">Todas las etapas</option>
                    {ETAPAS_COMERCIALES.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={filters.estadoConversacion || ''}
                    onChange={(e) => setFilters({ ...filters, estadoConversacion: e.target.value || undefined })}
                  >
                    <option value="">Todos los estados de conversación</option>
                    {(stats?.estadosConversacion || []).map((e) => (
                      <option key={e.value} value={e.value}>
                        {label('estado_conversacion', e.value)} ({e.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <button className="btn btn-outline-danger w-100" onClick={() => setFilters({})}>
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Contactos del bot</h5>
            <span className="badge bg-primary">{total || contactos.length} contactos</span>
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
                <h6 className="alert-heading">Error al cargar contactos</h6>
                {error}
              </div>
              <button className="btn btn-primary" onClick={fetchContactos}>Reintentar</button>
            </div>
          ) : contactos.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <Bot size={48} className="text-muted" />
              </div>
              <h5>No hay contactos</h5>
              <p className="text-muted">No se encontraron contactos del bot que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Contacto</th>
                    <th>Datos de contacto</th>
                    <th>Situación</th>
                    <th>Etapa</th>
                    <th>Conversación</th>
                    <th>Último mensaje</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contactos.map((c) => {
                    const etapa = etapaInfo(c.caso?.etapa_comercial)
                    const esperando = c.estado_conversacion === 'ESPERANDO_HUMANO'
                    return (
                      <tr key={c.id}>
                        <td>
                          <Link href={`/bot/${c.id}`} className="text-decoration-none fw-semibold">
                            {nombreContacto(c)}
                          </Link>
                          <div className="small text-muted">
                            {label('tipo_persona', c.tipo_persona)}
                            {c.ciudad && (
                              <span className="ms-2"><MapPin size={11} className="me-1" />{c.ciudad}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <small className="d-flex align-items-center gap-1">
                              <Phone size={12} />
                              {c.telefono}
                            </small>
                            <small className="d-flex align-items-center gap-1 text-muted">
                              <Mail size={12} />
                              {c.email || '-'}
                            </small>
                          </div>
                        </td>
                        <td>
                          <small>
                            <div>{label('situacion', c.caso?.situacion)}</div>
                            <div className="text-muted">Deuda: {labelRangoDinero(c.caso?.rango_deuda)}</div>
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${etapa.badge}`}>{etapa.label}</span>
                          {c.caso?.abogado_asignado && (
                            <div className="small text-muted mt-1">{c.caso.abogado_asignado}</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${esperando ? 'bg-danger' : 'bg-light text-dark border'}`}>
                            {label('estado_conversacion', c.estado_conversacion)}
                          </span>
                          <div className="small text-muted mt-1">
                            <MessageCircle size={11} className="me-1" />{c.totalMensajes} mensajes
                          </div>
                        </td>
                        <td>
                          <small className="text-muted" title={c.ultimo_mensaje_at ? new Date(c.ultimo_mensaje_at).toLocaleString() : ''}>
                            {fechaRelativa(c.ultimo_mensaje_at)}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Link href={`/bot/${c.id}`} className="btn btn-outline-primary btn-sm" title="Ver seguimiento">
                              <Eye size={14} />
                            </Link>
                            <button
                              className="btn btn-outline-success btn-sm"
                              title="Copiar a Leads"
                              onClick={() => abrirCopiar(c.id)}
                              disabled={cargandoBorrador === c.id}
                            >
                              {cargandoBorrador === c.id
                                ? <span className="spinner-border spinner-border-sm" role="status" />
                                : <Copy size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {copiando && (
        <CopiarLeadModal
          contactoId={copiando.contactoId}
          borrador={copiando.borrador}
          onClose={() => setCopiando(null)}
          onCopiado={() => { fetchContactos(); fetchStats() }}
        />
      )}
    </>
  )
}

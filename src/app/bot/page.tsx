'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import CopiarLeadModal, { LeadBorrador } from '@/components/CopiarLeadModal'
import { Bot, Search, Filter, Eye, Copy, Phone, Mail, MapPin, MessageCircle, UserCheck, Users, Loader2 } from 'lucide-react'
import { ETAPAS_COMERCIALES, etapaInfo, label, labelRangoDinero } from '@/modules/bot/labels'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Spinner, Alert } from '@/components/ui'
import { cn } from '@/lib/utils'

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
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-slate-800">
              <Bot size={28} />
              Bot WhatsApp
            </h1>
            <p className="mb-0 text-slate-500">Contactos captados por el chatbot: seguimiento comercial y copia a Leads</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="border-l-4 border-l-blue-800">
              <CardBody className="py-3">
                <div className="mb-1 flex items-center gap-2">
                  <Users size={16} className="text-blue-800" />
                  <span className="text-xs uppercase text-slate-500">Contactos</span>
                </div>
                <h3 className="mb-0 text-2xl font-bold text-blue-800">{stats.total}</h3>
              </CardBody>
            </Card>
            <Card className="border-l-4 border-l-red-600">
              <CardBody className="py-3">
                <div className="mb-1 flex items-center gap-2">
                  <UserCheck size={16} className="text-red-600" />
                  <span className="text-xs uppercase text-slate-500">Esperando abogado</span>
                </div>
                <h3 className="mb-0 text-2xl font-bold text-red-600">{stats.esperandoHumano}</h3>
              </CardBody>
            </Card>
            <Card className="border-l-4 border-l-sky-700">
              <CardBody className="py-3">
                <div className="mb-1 flex items-center gap-2">
                  <MessageCircle size={16} className="text-sky-700" />
                  <span className="text-xs uppercase text-slate-500">Nuevos</span>
                </div>
                <h3 className="mb-0 text-2xl font-bold text-sky-700">{stats.porEtapa.nuevo ?? 0}</h3>
              </CardBody>
            </Card>
            <Card className="border-l-4 border-l-teal-700">
              <CardBody className="py-3">
                <div className="mb-1 flex items-center gap-2">
                  <Copy size={16} className="text-teal-700" />
                  <span className="text-xs uppercase text-slate-500">Convertidos</span>
                </div>
                <h3 className="mb-0 text-2xl font-bold text-teal-700">{stats.porEtapa.convertido ?? 0}</h3>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card>
          <CardBody className="p-3">
            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  className="pl-9"
                  placeholder="Buscar por nombre, teléfono, email, documento o ciudad..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="md:self-end">
                <Filter size={16} />
                Filtros
              </Button>
            </div>

            {showFilters && (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Select
                  value={filters.etapa || ''}
                  onChange={(e) => setFilters({ ...filters, etapa: e.target.value || undefined })}
                >
                  <option value="">Todas las etapas</option>
                  {ETAPAS_COMERCIALES.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </Select>
                <Select
                  value={filters.estadoConversacion || ''}
                  onChange={(e) => setFilters({ ...filters, estadoConversacion: e.target.value || undefined })}
                >
                  <option value="">Todos los estados de conversación</option>
                  {(stats?.estadosConversacion || []).map((e) => (
                    <option key={e.value} value={e.value}>
                      {label('estado_conversacion', e.value)} ({e.count})
                    </option>
                  ))}
                </Select>
                <Button variant="outlineDanger" onClick={() => setFilters({})}>
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Contactos del bot</CardTitle>
          <Badge variant="primary">{total || contactos.length} contactos</Badge>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <Spinner />
          ) : error ? (
            <div className="py-5 text-center">
              <Alert variant="danger" title="Error al cargar contactos" className="mx-4 mb-4 text-left">
                {error}
              </Alert>
              <Button onClick={fetchContactos}>Reintentar</Button>
            </div>
          ) : contactos.length === 0 ? (
            <div className="py-5 text-center">
              <Bot size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-700">No hay contactos</h5>
              <p className="text-slate-500">No se encontraron contactos del bot que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 font-semibold">Datos de contacto</th>
                    <th className="px-4 py-3 font-semibold">Situación</th>
                    <th className="px-4 py-3 font-semibold">Etapa</th>
                    <th className="px-4 py-3 font-semibold">Conversación</th>
                    <th className="px-4 py-3 font-semibold">Último mensaje</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contactos.map((c) => {
                    const etapa = etapaInfo(c.caso?.etapa_comercial)
                    const esperando = c.estado_conversacion === 'ESPERANDO_HUMANO'
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 align-middle">
                          <Link href={`/bot/${c.id}`} className="font-semibold text-slate-800 no-underline hover:text-blue-800">
                            {nombreContacto(c)}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {label('tipo_persona', c.tipo_persona)}
                            {c.ciudad && (
                              <span className="ml-2 inline-flex items-center gap-1"><MapPin size={11} />{c.ciudad}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="flex items-center gap-1 text-slate-700">
                              <Phone size={12} />
                              {c.telefono}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <Mail size={12} />
                              {c.email || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-xs">
                          <div>{label('situacion', c.caso?.situacion)}</div>
                          <div className="text-slate-500">Deuda: {labelRangoDinero(c.caso?.rango_deuda)}</div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={etapa.badgeVariant}>{etapa.label}</Badge>
                          {c.caso?.abogado_asignado && (
                            <div className="mt-1 text-xs text-slate-500">{c.caso.abogado_asignado}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={esperando ? 'danger' : 'outline'}>
                            {label('estado_conversacion', c.estado_conversacion)}
                          </Badge>
                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MessageCircle size={11} />{c.totalMensajes} mensajes
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="text-xs text-slate-500" title={c.ultimo_mensaje_at ? new Date(c.ultimo_mensaje_at).toLocaleString() : ''}>
                            {fechaRelativa(c.ultimo_mensaje_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex gap-1">
                            <Link
                              href={`/bot/${c.id}`}
                              className={cn(
                                'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-800 text-blue-800 hover:bg-blue-50'
                              )}
                              title="Ver seguimiento"
                            >
                              <Eye size={14} />
                            </Link>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-teal-700 text-teal-700 hover:bg-teal-50"
                              title="Copiar a Leads"
                              onClick={() => abrirCopiar(c.id)}
                              disabled={cargandoBorrador === c.id}
                            >
                              {cargandoBorrador === c.id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Copy size={14} />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

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

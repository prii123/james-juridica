'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import CopiarLeadModal, { LeadBorrador } from '@/components/CopiarLeadModal'
import {
  ArrowLeft, Bot, Copy, Phone, Mail, MapPin, User, FileText, MessageCircle,
  Save, ExternalLink, ClipboardList, Briefcase, CheckCircle2, Clock,
} from 'lucide-react'
import { ETAPAS_COMERCIALES, etapaInfo, label, labelList, labelRangoDinero, humanize } from '@/modules/bot/labels'

interface CasoBot {
  id: string
  situacion: string | null
  rango_deuda: string | null
  num_acreedores: string | null
  tipos_acreedores: unknown
  tiene_bienes: boolean | null
  bienes: unknown
  rango_ingresos: string | null
  procesos_judiciales: string | null
  preferencia_contacto: string | null
  horario_contacto: string | null
  notas: string | null
  etapa_comercial: string
  abogado_asignado: string | null
  created_at: string
  updated_at: string
}

interface MensajeBot {
  id: string
  direccion: 'in' | 'out' | string
  tipo: string
  contenido: string | null
  media_url: string | null
  mime_type: string | null
  estado_entrega: string | null
  created_at: string
}

interface RespuestaCaptura {
  id: string
  paso: string
  pregunta: string
  respuesta_raw: string
  respuesta_normalizada: string | null
  valida: boolean
  created_at: string
}

interface ContactoDetalle {
  id: string
  telefono: string
  nombre_perfil: string | null
  nombre: string | null
  email: string | null
  tipo_persona: string | null
  ciudad: string | null
  documento: string | null
  estado_conversacion: string
  consentimiento_datos: boolean
  consentimiento_at: string | null
  origen: string | null
  ultimo_mensaje_at: string | null
  created_at: string
  casos: CasoBot[]
  caso: CasoBot | null
  mensajes: MensajeBot[]
  respuestas_captura: RespuestaCaptura[]
  leadExistente: { id: string; nombre: string; estado: string; createdAt: string } | null
  leadBorrador: LeadBorrador
}

export default function BotContactoPage() {
  const params = useParams()
  const contactoId = params.contactoId as string

  const [contacto, setContacto] = useState<ContactoDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCopiar, setShowCopiar] = useState(false)
  const [tab, setTab] = useState<'conversacion' | 'respuestas'>('conversacion')

  // Seguimiento
  const [etapa, setEtapa] = useState('nuevo')
  const [abogado, setAbogado] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardadoMsg, setGuardadoMsg] = useState<{ ok: boolean; msg: string } | null>(null)

  const chatRef = useRef<HTMLDivElement>(null)

  const fetchContacto = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/bot/${contactoId}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al cargar el contacto')
        return
      }
      setContacto(data)
      setEtapa(data.caso?.etapa_comercial || 'nuevo')
      setAbogado(data.caso?.abogado_asignado || '')
      setNotas(data.caso?.notas || '')
    } catch {
      setError('Error de conexión. Por favor, inténtelo de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [contactoId])

  useEffect(() => {
    fetchContacto()
  }, [fetchContacto])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [contacto?.mensajes, tab])

  const guardarSeguimiento = async () => {
    setGuardando(true)
    setGuardadoMsg(null)
    try {
      const res = await fetch(`/api/bot/${contactoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          casoId: contacto?.caso?.id,
          etapa_comercial: etapa,
          abogado_asignado: abogado.trim() || null,
          notas,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGuardadoMsg({ ok: false, msg: data.error || 'No se pudo guardar el seguimiento' })
        return
      }
      setGuardadoMsg({ ok: true, msg: 'Seguimiento guardado' })
      setContacto((c) => c ? { ...c, caso: { ...(c.caso || data), ...data } } : c)
    } catch {
      setGuardadoMsg({ ok: false, msg: 'Error de conexión' })
    } finally {
      setGuardando(false)
    }
  }

  const agregarNotaRapida = () => {
    const marca = `[${new Date().toLocaleString('es-CO')}] `
    setNotas((n) => (n ? `${n}\n${marca}` : marca))
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

  if (error || !contacto) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Bot', href: '/bot' }, { label: 'Contacto' }]} />
        <div className="alert alert-danger" role="alert">{error || 'Contacto no encontrado'}</div>
        <Link href="/bot" className="btn btn-outline-secondary d-flex align-items-center gap-2" style={{ width: 'fit-content' }}>
          <ArrowLeft size={16} /> Volver
        </Link>
      </>
    )
  }

  const nombre = contacto.nombre || contacto.nombre_perfil || 'Sin nombre'
  const caso = contacto.caso
  const etapaActual = etapaInfo(caso?.etapa_comercial)
  const esperando = contacto.estado_conversacion === 'ESPERANDO_HUMANO'
  const seguimientoCambiado =
    etapa !== (caso?.etapa_comercial || 'nuevo') ||
    abogado.trim() !== (caso?.abogado_asignado || '') ||
    notas !== (caso?.notas || '')

  return (
    <>
      <Breadcrumb items={[{ label: 'Bot', href: '/bot' }, { label: nombre }]} />

      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Bot size={26} />
            {nombre}
          </h1>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className={`badge ${etapaActual.badge}`}>{etapaActual.label}</span>
            <span className={`badge ${esperando ? 'bg-danger' : 'bg-light text-dark border'}`}>
              {label('estado_conversacion', contacto.estado_conversacion)}
            </span>
            {contacto.leadExistente && (
              <Link href={`/leads/${contacto.leadExistente.id}`} className="badge bg-success text-decoration-none d-flex align-items-center gap-1">
                <CheckCircle2 size={12} /> Ya está en Leads
              </Link>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link href="/bot" className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <ArrowLeft size={16} /> Volver
          </Link>
          {contacto.leadExistente ? (
            <Link href={`/leads/${contacto.leadExistente.id}`} className="btn btn-success d-flex align-items-center gap-2">
              <ExternalLink size={16} /> Ver lead
            </Link>
          ) : (
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowCopiar(true)}>
              <Copy size={16} /> Copiar a Leads
            </button>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* Columna izquierda: datos */}
        <div className="col-lg-5">
          {/* Contacto */}
          <div className="card mb-4">
            <div className="card-header bg-light d-flex align-items-center gap-2">
              <User size={16} />
              <h6 className="mb-0">Datos del contacto</h6>
            </div>
            <div className="card-body">
              <dl className="row mb-0 small">
                <dt className="col-5 text-muted">Teléfono</dt>
                <dd className="col-7 d-flex align-items-center gap-1">
                  <Phone size={12} />
                  <a href={`https://wa.me/${contacto.telefono}`} target="_blank" rel="noreferrer" className="text-decoration-none">
                    {contacto.telefono}
                  </a>
                </dd>
                <dt className="col-5 text-muted">Email</dt>
                <dd className="col-7 d-flex align-items-center gap-1"><Mail size={12} />{contacto.email || '-'}</dd>
                <dt className="col-5 text-muted">Nombre en WhatsApp</dt>
                <dd className="col-7">{contacto.nombre_perfil || '-'}</dd>
                <dt className="col-5 text-muted">Tipo de persona</dt>
                <dd className="col-7">{label('tipo_persona', contacto.tipo_persona)}</dd>
                <dt className="col-5 text-muted">Documento</dt>
                <dd className="col-7">{contacto.documento || '-'}</dd>
                <dt className="col-5 text-muted">Ciudad</dt>
                <dd className="col-7 d-flex align-items-center gap-1"><MapPin size={12} />{contacto.ciudad || '-'}</dd>
                <dt className="col-5 text-muted">Origen</dt>
                <dd className="col-7">{humanize(contacto.origen)}</dd>
                <dt className="col-5 text-muted">Consentimiento datos</dt>
                <dd className="col-7">
                  {contacto.consentimiento_datos
                    ? <span className="text-success">Sí{contacto.consentimiento_at && ` · ${new Date(contacto.consentimiento_at).toLocaleString()}`}</span>
                    : <span className="text-danger">No</span>}
                </dd>
                <dt className="col-5 text-muted">Primer contacto</dt>
                <dd className="col-7">{new Date(contacto.created_at).toLocaleString()}</dd>
                <dt className="col-5 text-muted">Último mensaje</dt>
                <dd className="col-7">{contacto.ultimo_mensaje_at ? new Date(contacto.ultimo_mensaje_at).toLocaleString() : '-'}</dd>
              </dl>
            </div>
          </div>

          {/* Caso */}
          <div className="card mb-4">
            <div className="card-header bg-light d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <Briefcase size={16} />
                <h6 className="mb-0">Información del caso</h6>
              </div>
              {contacto.casos.length > 1 && (
                <span className="badge bg-secondary" title="El bot creó más de un caso; se muestra el más reciente">
                  {contacto.casos.length} casos
                </span>
              )}
            </div>
            <div className="card-body">
              {!caso ? (
                <p className="text-muted small mb-0">El bot aún no ha capturado información del caso.</p>
              ) : (
                <dl className="row mb-0 small">
                  <dt className="col-5 text-muted">Situación</dt>
                  <dd className="col-7">{label('situacion', caso.situacion)}</dd>
                  <dt className="col-5 text-muted">Deuda total</dt>
                  <dd className="col-7">{labelRangoDinero(caso.rango_deuda)}</dd>
                  <dt className="col-5 text-muted">N° acreedores</dt>
                  <dd className="col-7">{label('num_acreedores', caso.num_acreedores)}</dd>
                  <dt className="col-5 text-muted">Tipos de acreedores</dt>
                  <dd className="col-7">{labelList('tipos_acreedores', caso.tipos_acreedores)}</dd>
                  <dt className="col-5 text-muted">Bienes</dt>
                  <dd className="col-7">
                    {caso.tiene_bienes === null ? '-' : caso.tiene_bienes ? labelList('bienes', caso.bienes) : 'No tiene'}
                  </dd>
                  <dt className="col-5 text-muted">Ingresos</dt>
                  <dd className="col-7">{labelRangoDinero(caso.rango_ingresos)}</dd>
                  <dt className="col-5 text-muted">Procesos judiciales</dt>
                  <dd className="col-7">{label('procesos_judiciales', caso.procesos_judiciales)}</dd>
                  <dt className="col-5 text-muted">Contacto preferido</dt>
                  <dd className="col-7">
                    {label('preferencia_contacto', caso.preferencia_contacto)}
                    {caso.horario_contacto && <span className="text-muted"> · {caso.horario_contacto}</span>}
                  </dd>
                  <dt className="col-5 text-muted">Actualizado</dt>
                  <dd className="col-7">{new Date(caso.updated_at).toLocaleString()}</dd>
                </dl>
              )}
            </div>
          </div>

          {/* Seguimiento */}
          <div className="card">
            <div className="card-header bg-light d-flex align-items-center gap-2">
              <ClipboardList size={16} />
              <h6 className="mb-0">Seguimiento comercial</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label small text-muted">Etapa</label>
                <select className="form-select" value={etapa} onChange={(e) => setEtapa(e.target.value)}>
                  {ETAPAS_COMERCIALES.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted">Abogado asignado</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre del abogado"
                  value={abogado}
                  onChange={(e) => setAbogado(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label small text-muted mb-1">Notas de seguimiento</label>
                  <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={agregarNotaRapida}>
                    <Clock size={12} className="me-1" />Agregar nota con fecha
                  </button>
                </div>
                <textarea
                  className="form-control"
                  rows={6}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Registre llamadas, acuerdos, próximos pasos..."
                />
              </div>
              {guardadoMsg && (
                <div className={`alert py-2 small ${guardadoMsg.ok ? 'alert-success' : 'alert-danger'}`} role="alert">
                  {guardadoMsg.msg}
                </div>
              )}
              <button
                className="btn btn-primary d-flex align-items-center gap-2 w-100 justify-content-center"
                onClick={guardarSeguimiento}
                disabled={guardando || !seguimientoCambiado}
              >
                {guardando ? <span className="spinner-border spinner-border-sm" role="status" /> : <Save size={16} />}
                Guardar seguimiento
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha: conversación / respuestas */}
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header bg-light">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button className={`nav-link d-flex align-items-center gap-2 ${tab === 'conversacion' ? 'active' : ''}`} onClick={() => setTab('conversacion')}>
                    <MessageCircle size={14} /> Conversación
                    <span className="badge bg-secondary">{contacto.mensajes.length}</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link d-flex align-items-center gap-2 ${tab === 'respuestas' ? 'active' : ''}`} onClick={() => setTab('respuestas')}>
                    <FileText size={14} /> Respuestas capturadas
                    <span className="badge bg-secondary">{contacto.respuestas_captura.length}</span>
                  </button>
                </li>
              </ul>
            </div>

            {tab === 'conversacion' ? (
              <div
                ref={chatRef}
                className="card-body overflow-auto"
                style={{ maxHeight: '75vh', backgroundColor: '#efeae2' }}
              >
                {contacto.mensajes.length === 0 ? (
                  <p className="text-muted text-center small mb-0">Sin mensajes registrados.</p>
                ) : (
                  contacto.mensajes.map((m) => {
                    const entrante = m.direccion === 'in'
                    return (
                      <div key={m.id} className={`d-flex mb-2 ${entrante ? 'justify-content-start' : 'justify-content-end'}`}>
                        <div
                          className="rounded-3 px-3 py-2 shadow-sm small"
                          style={{
                            maxWidth: '80%',
                            backgroundColor: entrante ? '#ffffff' : '#d9fdd3',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {m.contenido || <em className="text-muted">[{humanize(m.tipo)}]</em>}
                          {m.media_url && (
                            <div className="mt-1">
                              <a href={m.media_url} target="_blank" rel="noreferrer" className="small">
                                Ver adjunto{m.mime_type ? ` (${m.mime_type})` : ''}
                              </a>
                            </div>
                          )}
                          <div className="text-end text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                            {new Date(m.created_at).toLocaleString()}
                            {!entrante && m.estado_entrega && ` · ${humanize(m.estado_entrega)}`}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="card-body p-0 overflow-auto" style={{ maxHeight: '75vh' }}>
                {contacto.respuestas_captura.length === 0 ? (
                  <p className="text-muted text-center small py-4 mb-0">Sin respuestas capturadas.</p>
                ) : (
                  <table className="table table-sm table-hover mb-0 small align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Paso</th>
                        <th>Pregunta</th>
                        <th>Respuesta</th>
                        <th>Normalizada</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacto.respuestas_captura.map((r) => (
                        <tr key={r.id} className={r.valida ? '' : 'table-warning'}>
                          <td><code>{r.paso}</code></td>
                          <td className="text-muted" style={{ maxWidth: 220 }}>{r.pregunta}</td>
                          <td>{r.respuesta_raw}</td>
                          <td>{r.respuesta_normalizada || '-'}{!r.valida && <span className="badge bg-warning text-dark ms-1">inválida</span>}</td>
                          <td className="text-muted text-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCopiar && (
        <CopiarLeadModal
          contactoId={contacto.id}
          borrador={contacto.leadBorrador}
          onClose={() => setShowCopiar(false)}
          onCopiado={() => fetchContacto()}
        />
      )}
    </>
  )
}

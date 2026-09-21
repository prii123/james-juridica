'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import CopiarLeadModal, { LeadBorrador } from '@/components/CopiarLeadModal'
import ResponderBotTab from '@/components/ResponderBotTab'
import {
  ArrowLeft, Bot, Copy, Phone, Mail, MapPin, User, FileText, MessageCircle,
  Save, ExternalLink, ClipboardList, Briefcase, CheckCircle2, Clock, Reply,
} from 'lucide-react'
import { ETAPAS_COMERCIALES, etapaInfo, label, labelList, labelRangoDinero, humanize } from '@/modules/bot/labels'
import { Button, Card, CardHeader, CardBody, Badge, Textarea, Select, Label as FieldLabel, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

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
  const [tab, setTab] = useState<'conversacion' | 'respuestas' | 'responder'>('conversacion')

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
    return <Spinner />
  }

  if (error || !contacto) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Bot', href: '/bot' }, { label: 'Contacto' }]} />
        <Alert variant="danger" className="mb-4">{error || 'Contacto no encontrado'}</Alert>
        <Link href="/bot">
          <Button variant="outline">
            <ArrowLeft size={16} /> Volver
          </Button>
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
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Bot size={26} />
            {nombre}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={etapaActual.badgeVariant}>{etapaActual.label}</Badge>
            <Badge variant={esperando ? 'danger' : 'outline'}>
              {label('estado_conversacion', contacto.estado_conversacion)}
            </Badge>
            {contacto.leadExistente && (
              <Link href={`/leads/${contacto.leadExistente.id}`}>
                <Badge variant="success" className="cursor-pointer no-underline">
                  <CheckCircle2 size={12} /> Ya está en Leads
                </Badge>
              </Link>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/bot">
            <Button variant="outline">
              <ArrowLeft size={16} /> Volver
            </Button>
          </Link>
          {contacto.leadExistente ? (
            <Link href={`/leads/${contacto.leadExistente.id}`}>
              <Button variant="success">
                <ExternalLink size={16} /> Ver lead
              </Button>
            </Link>
          ) : (
            <Button onClick={() => setShowCopiar(true)}>
              <Copy size={16} /> Copiar a Leads
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna izquierda: datos */}
        <div className="space-y-4 lg:col-span-5">
          {/* Contacto */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User size={16} />
                <h6 className="m-0 font-semibold text-slate-800">Datos del contacto</h6>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-y-2 text-sm">
                <dt className="text-slate-500">Teléfono</dt>
                <dd className="flex items-center gap-1">
                  <Phone size={12} />
                  <a href={`https://wa.me/${contacto.telefono}`} target="_blank" rel="noreferrer" className="text-blue-800 hover:underline">
                    {contacto.telefono}
                  </a>
                </dd>
                <dt className="text-slate-500">Email</dt>
                <dd className="flex items-center gap-1"><Mail size={12} />{contacto.email || '-'}</dd>
                <dt className="text-slate-500">Nombre en WhatsApp</dt>
                <dd>{contacto.nombre_perfil || '-'}</dd>
                <dt className="text-slate-500">Tipo de persona</dt>
                <dd>{label('tipo_persona', contacto.tipo_persona)}</dd>
                <dt className="text-slate-500">Documento</dt>
                <dd>{contacto.documento || '-'}</dd>
                <dt className="text-slate-500">Ciudad</dt>
                <dd className="flex items-center gap-1"><MapPin size={12} />{contacto.ciudad || '-'}</dd>
                <dt className="text-slate-500">Origen</dt>
                <dd>{humanize(contacto.origen)}</dd>
                <dt className="text-slate-500">Consentimiento datos</dt>
                <dd>
                  {contacto.consentimiento_datos
                    ? <span className="text-teal-700">Sí{contacto.consentimiento_at && ` · ${new Date(contacto.consentimiento_at).toLocaleString()}`}</span>
                    : <span className="text-red-600">No</span>}
                </dd>
                <dt className="text-slate-500">Primer contacto</dt>
                <dd>{new Date(contacto.created_at).toLocaleString()}</dd>
                <dt className="text-slate-500">Último mensaje</dt>
                <dd>{contacto.ultimo_mensaje_at ? new Date(contacto.ultimo_mensaje_at).toLocaleString() : '-'}</dd>
              </dl>
            </CardBody>
          </Card>

          {/* Caso */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase size={16} />
                <h6 className="m-0 font-semibold text-slate-800">Información del caso</h6>
              </div>
              {contacto.casos.length > 1 && (
                <Badge variant="secondary" title="El bot creó más de un caso; se muestra el más reciente">
                  {contacto.casos.length} casos
                </Badge>
              )}
            </CardHeader>
            <CardBody>
              {!caso ? (
                <p className="mb-0 text-sm text-slate-500">El bot aún no ha capturado información del caso.</p>
              ) : (
                <dl className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-y-2 text-sm">
                  <dt className="text-slate-500">Situación</dt>
                  <dd>{label('situacion', caso.situacion)}</dd>
                  <dt className="text-slate-500">Deuda total</dt>
                  <dd>{labelRangoDinero(caso.rango_deuda)}</dd>
                  <dt className="text-slate-500">N° acreedores</dt>
                  <dd>{label('num_acreedores', caso.num_acreedores)}</dd>
                  <dt className="text-slate-500">Tipos de acreedores</dt>
                  <dd>{labelList('tipos_acreedores', caso.tipos_acreedores)}</dd>
                  <dt className="text-slate-500">Bienes</dt>
                  <dd>
                    {caso.tiene_bienes === null ? '-' : caso.tiene_bienes ? labelList('bienes', caso.bienes) : 'No tiene'}
                  </dd>
                  <dt className="text-slate-500">Ingresos</dt>
                  <dd>{labelRangoDinero(caso.rango_ingresos)}</dd>
                  <dt className="text-slate-500">Procesos judiciales</dt>
                  <dd>{label('procesos_judiciales', caso.procesos_judiciales)}</dd>
                  <dt className="text-slate-500">Contacto preferido</dt>
                  <dd>
                    {label('preferencia_contacto', caso.preferencia_contacto)}
                    {caso.horario_contacto && <span className="text-slate-500"> · {caso.horario_contacto}</span>}
                  </dd>
                  <dt className="text-slate-500">Actualizado</dt>
                  <dd>{new Date(caso.updated_at).toLocaleString()}</dd>
                </dl>
              )}
            </CardBody>
          </Card>

          {/* Seguimiento */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList size={16} />
                <h6 className="m-0 font-semibold text-slate-800">Seguimiento comercial</h6>
              </div>
            </CardHeader>
            <CardBody>
              <div className="mb-3">
                <FieldLabel htmlFor="etapa">Etapa</FieldLabel>
                <Select id="etapa" value={etapa} onChange={(e) => setEtapa(e.target.value)}>
                  {ETAPAS_COMERCIALES.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </Select>
              </div>
              <div className="mb-3">
                <FieldLabel htmlFor="abogado">Abogado asignado</FieldLabel>
                <input
                  id="abogado"
                  type="text"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
                  placeholder="Nombre del abogado"
                  value={abogado}
                  onChange={(e) => setAbogado(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between">
                  <FieldLabel htmlFor="notas" className="mb-0">Notas de seguimiento</FieldLabel>
                  <button type="button" className="flex items-center text-xs text-blue-800 hover:underline" onClick={agregarNotaRapida}>
                    <Clock size={12} className="mr-1" />Agregar nota con fecha
                  </button>
                </div>
                <Textarea
                  id="notas"
                  rows={6}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Registre llamadas, acuerdos, próximos pasos..."
                />
              </div>
              {guardadoMsg && (
                <Alert variant={guardadoMsg.ok ? 'success' : 'danger'} className="mb-3 py-2 text-sm">
                  {guardadoMsg.msg}
                </Alert>
              )}
              <Button
                className="w-full justify-center"
                onClick={guardarSeguimiento}
                loading={guardando}
                disabled={!seguimientoCambiado}
              >
                {!guardando && <Save size={16} />}
                Guardar seguimiento
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Columna derecha: conversación / respuestas */}
        <div className="lg:col-span-7">
          <Card className="flex h-full flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-2">
              <div className="flex gap-1">
                <button
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium',
                    tab === 'conversacion' ? 'border-blue-800 text-blue-800' : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                  onClick={() => setTab('conversacion')}
                >
                  <MessageCircle size={14} /> Conversación
                  <Badge variant="secondary">{contacto.mensajes.length}</Badge>
                </button>
                <button
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium',
                    tab === 'respuestas' ? 'border-blue-800 text-blue-800' : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                  onClick={() => setTab('respuestas')}
                >
                  <FileText size={14} /> Respuestas capturadas
                  <Badge variant="secondary">{contacto.respuestas_captura.length}</Badge>
                </button>
                <button
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium',
                    tab === 'responder' ? 'border-blue-800 text-blue-800' : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                  onClick={() => setTab('responder')}
                >
                  <Reply size={14} /> Responder
                  {esperando && <Badge variant="danger">Esperando</Badge>}
                </button>
              </div>
            </div>

            {tab === 'responder' ? (
              <ResponderBotTab contactoId={contacto.id} />
            ) : tab === 'conversacion' ? (
              <div
                ref={chatRef}
                className="overflow-auto p-4"
                style={{ maxHeight: '75vh', backgroundColor: '#efeae2' }}
              >
                {contacto.mensajes.length === 0 ? (
                  <p className="mb-0 text-center text-sm text-slate-500">Sin mensajes registrados.</p>
                ) : (
                  contacto.mensajes.map((m) => {
                    const entrante = m.direccion === 'in'
                    return (
                      <div key={m.id} className={cn('mb-2 flex', entrante ? 'justify-start' : 'justify-end')}>
                        <div
                          className="max-w-[80%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm shadow-sm"
                          style={{ backgroundColor: entrante ? '#ffffff' : '#d9fdd3' }}
                        >
                          {m.contenido || <em className="text-slate-500">[{humanize(m.tipo)}]</em>}
                          {m.media_url && (
                            <div className="mt-1">
                              <a href={m.media_url} target="_blank" rel="noreferrer" className="text-xs text-blue-800 hover:underline">
                                Ver adjunto{m.mime_type ? ` (${m.mime_type})` : ''}
                              </a>
                            </div>
                          )}
                          <div className="mt-1 text-right text-[0.7rem] text-slate-500">
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
              <div className="overflow-auto" style={{ maxHeight: '75vh' }}>
                {contacto.respuestas_captura.length === 0 ? (
                  <p className="mb-0 py-4 text-center text-sm text-slate-500">Sin respuestas capturadas.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Paso</th>
                        <th className="px-3 py-2 font-semibold">Pregunta</th>
                        <th className="px-3 py-2 font-semibold">Respuesta</th>
                        <th className="px-3 py-2 font-semibold">Normalizada</th>
                        <th className="px-3 py-2 font-semibold">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contacto.respuestas_captura.map((r) => (
                        <tr key={r.id} className={cn(!r.valida && 'bg-amber-50')}>
                          <td className="px-3 py-2 align-middle"><code className="text-xs">{r.paso}</code></td>
                          <td className="max-w-[220px] px-3 py-2 align-middle text-slate-500">{r.pregunta}</td>
                          <td className="px-3 py-2 align-middle">{r.respuesta_raw}</td>
                          <td className="px-3 py-2 align-middle">
                            {r.respuesta_normalizada || '-'}
                            {!r.valida && <Badge variant="warning" className="ml-1">inválida</Badge>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 align-middle text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </Card>
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

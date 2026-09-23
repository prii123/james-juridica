'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Send, Loader2, Bot as BotIcon, CheckCircle2 } from 'lucide-react'
import { Alert, Button, Spinner, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'

interface MensajeBot {
  id: string
  direccion: 'in' | 'out' | string
  contenido: string | null
  tipo: string
  estadoEntrega: string | null
  createdAt: string
  payloadRaw?: { origen?: string; autor?: string | null } | null
}

interface Conversacion {
  contacto: { estadoConversacion: string }
  mensajes: MensajeBot[]
}

const POLL_MS = 6000

/**
 * Tab "Responder": habla directo con el servicio del bot (Lambda), independiente del tab
 * "Conversación" que lee la BD del bot directamente. Así, si uno de los dos caminos falla,
 * el otro sigue funcionando.
 */
export default function ResponderBotTab({
  contactoId,
  onEstadoCambiado,
}: {
  contactoId: string
  onEstadoCambiado?: () => void
}) {
  const [data, setData] = useState<Conversacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviarError, setEnviarError] = useState<string | null>(null)
  const [cerrando, setCerrando] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const fetchConversacion = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true)
      const res = await fetch(`/api/bot/${contactoId}/responder`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        if (!silencioso) setError(json.error || 'No se pudo cargar la conversación')
        return
      }
      setData(json)
      setError(null)
    } catch {
      if (!silencioso) setError('Error de conexión con el servicio del bot')
    } finally {
      if (!silencioso) setLoading(false)
    }
  }, [contactoId])

  useEffect(() => {
    fetchConversacion()
    const interval = setInterval(() => fetchConversacion(true), POLL_MS)
    return () => clearInterval(interval)
  }, [fetchConversacion])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [data?.mensajes])

  const esperandoAbogado = data?.contacto.estadoConversacion === 'ESPERANDO_HUMANO'

  const enviar = async () => {
    const contenido = texto.trim()
    if (!contenido) return
    setEnviando(true)
    setEnviarError(null)
    try {
      const res = await fetch(`/api/bot/${contactoId}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: contenido }),
      })
      const json = await res.json()
      if (!res.ok) {
        setEnviarError(json.error || 'No se pudo enviar el mensaje')
        return
      }
      setTexto('')
      await fetchConversacion(true)
    } catch {
      setEnviarError('Error de conexión al enviar')
    } finally {
      setEnviando(false)
    }
  }

  const cerrarAtencion = async () => {
    if (!confirm('¿Cerrar la atención? El bot volverá a responder los mensajes de este cliente.')) return
    setCerrando(true)
    setEnviarError(null)
    try {
      const res = await fetch(`/api/bot/${contactoId}/cerrar`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setEnviarError(json.error || 'No se pudo cerrar la atención')
        return
      }
      await fetchConversacion(true)
      onEstadoCambiado?.()
    } catch {
      setEnviarError('Error de conexión al cerrar la atención')
    } finally {
      setCerrando(false)
    }
  }

  if (loading) return <Spinner />

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="danger" title="No se pudo cargar" className="mb-3">{error}</Alert>
        <Button variant="outline" onClick={() => fetchConversacion()}>Reintentar</Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex h-full flex-col">
      <div
        ref={chatRef}
        className="flex-1 overflow-auto p-4"
        style={{ maxHeight: '60vh', backgroundColor: '#efeae2' }}
      >
        {data.mensajes.length === 0 ? (
          <p className="mb-0 text-center text-sm text-slate-500">Sin mensajes registrados.</p>
        ) : (
          data.mensajes.map((m) => {
            const entrante = m.direccion === 'in'
            const autor = m.payloadRaw?.origen === 'abogado' ? m.payloadRaw?.autor : null
            return (
              <div key={m.id} className={cn('mb-2 flex', entrante ? 'justify-start' : 'justify-end')}>
                <div
                  className="max-w-[80%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm shadow-sm"
                  style={{ backgroundColor: entrante ? '#ffffff' : '#d9fdd3' }}
                >
                  {m.contenido || <em className="text-slate-500">[{m.tipo}]</em>}
                  <div className="mt-1 text-right text-[0.7rem] text-slate-500">
                    {autor && <span className="mr-1 font-medium">{autor} ·</span>}
                    {new Date(m.createdAt).toLocaleString()}
                    {!entrante && m.estadoEntrega && ` · ${m.estadoEntrega}`}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        {!esperandoAbogado ? (
          <Alert variant="warning" className="mb-0 py-2 text-sm">
            El bot sigue atendiendo esta conversación. Solo se puede responder manualmente cuando el
            cliente pide hablar con un abogado (estado &quot;Esperando abogado&quot;).
          </Alert>
        ) : (
          <>
            {enviarError && (
              <Alert variant="danger" className="mb-2 py-2 text-sm">{enviarError}</Alert>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                rows={2}
                placeholder="Escriba la respuesta para el cliente..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviar()
                  }
                }}
                disabled={enviando || cerrando}
                className="flex-1"
              />
              <Button onClick={enviar} disabled={enviando || cerrando || !texto.trim()}>
                {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Enviar
              </Button>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="mb-0 flex items-center gap-1 text-xs text-slate-400">
                <BotIcon size={12} /> Se envía por WhatsApp con el mismo número del despacho.
              </p>
              <Button
                variant="outlineDanger"
                size="sm"
                onClick={cerrarAtencion}
                loading={cerrando}
                disabled={enviando}
              >
                <CheckCircle2 size={14} /> Cerrar atención
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

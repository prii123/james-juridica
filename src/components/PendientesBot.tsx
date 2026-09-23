'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, BellRing, MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Aviso de clientes del bot en "Esperando abogado". Sin WebSockets: consulta periódica a
// /api/bot/pendientes (un count + los más recientes), compartida por todo el layout.

export interface PendienteBot {
  id: string
  nombre: string
  ultimoMensajeAt: string | null
}

interface PendientesState {
  total: number
  contactos: PendienteBot[]
  habilitado: boolean
  refrescar: () => void
}

export const URL_PENDIENTES = '/bot?estadoConversacion=ESPERANDO_HUMANO'

const POLL_VISIBLE_MS = 30_000
// Con la pestaña oculta se sigue consultando (para la notificación del navegador), pero menos.
const POLL_OCULTO_MS = 60_000
const AVISADOS_KEY = 'bot-pendientes-avisados'
const AVISADOS_TTL_MS = 24 * 60 * 60 * 1000

const PendientesContext = createContext<PendientesState>({
  total: 0,
  contactos: [],
  habilitado: false,
  refrescar: () => {},
})

export const usePendientesBot = () => useContext(PendientesContext)

/**
 * Marca como avisados los contactos que ninguna otra pestaña haya avisado ya y devuelve solo
 * esos. La clave incluye ultimoMensajeAt para volver a avisar si el cliente sale y vuelve a pedir abogado.
 */
function reclamarAvisos(nuevos: PendienteBot[]): PendienteBot[] {
  try {
    const ahora = Date.now()
    const avisados: Record<string, number> = JSON.parse(localStorage.getItem(AVISADOS_KEY) || '{}')
    for (const [k, t] of Object.entries(avisados)) if (ahora - t > AVISADOS_TTL_MS) delete avisados[k]

    const propios = nuevos.filter((c) => {
      const clave = `${c.id}:${c.ultimoMensajeAt ?? ''}`
      if (avisados[clave]) return false
      avisados[clave] = ahora
      return true
    })
    localStorage.setItem(AVISADOS_KEY, JSON.stringify(avisados))
    return propios
  } catch {
    return nuevos
  }
}

function sonar() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => ctx.close()
  } catch {
    // El navegador puede bloquear el audio hasta que el usuario interactúe con la página.
  }
}

export function haceCuanto(fecha: string | null): string {
  if (!fecha) return ''
  const min = Math.floor((Date.now() - new Date(fecha).getTime()) / 60_000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export function PendientesBotProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [total, setTotal] = useState(0)
  const [contactos, setContactos] = useState<PendienteBot[]>([])
  const [habilitado, setHabilitado] = useState(true)
  const [aviso, setAviso] = useState<{ texto: string; href: string } | null>(null)
  // null = aún no hay línea base; la primera carga no avisa de lo que ya estaba esperando.
  const idsPrevios = useRef<Set<string> | null>(null)
  const refrescarRef = useRef<() => void>(() => {})

  const avisar = useCallback((nuevos: PendienteBot[]) => {
    const texto =
      nuevos.length === 1
        ? `${nuevos[0].nombre} está esperando un abogado`
        : `${nuevos.length} clientes nuevos esperando abogado`
    const href = nuevos.length === 1 ? `/bot/${nuevos[0].id}` : URL_PENDIENTES

    setAviso({ texto, href })
    sonar()

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        const n = new Notification('Cliente esperando abogado', { body: texto, tag: 'bot-pendientes' })
        n.onclick = () => {
          window.focus()
          router.push(href)
          n.close()
        }
      } catch {
        // Algunos navegadores móviles solo permiten notificaciones desde un service worker.
      }
    }
  }, [router])

  // Devuelve false si no tiene sentido seguir consultando (sin sesión o sin permiso).
  const consultar = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/bot/pendientes', { cache: 'no-store' })
      if (res.status === 401 || res.status === 403) {
        setHabilitado(false)
        return false
      }
      if (!res.ok) return true
      const data: { total: number; contactos: PendienteBot[] } = await res.json()

      const previos = idsPrevios.current
      if (previos) {
        const nuevos = data.contactos.filter((c) => !previos.has(c.id))
        const propios = nuevos.length ? reclamarAvisos(nuevos) : []
        if (propios.length) avisar(propios)
      }
      idsPrevios.current = new Set(data.contactos.map((c) => c.id))

      setTotal(data.total)
      setContactos(data.contactos)
      return true
    } catch {
      return true // fallo de red puntual: se reintenta en el siguiente ciclo
    }
  }, [avisar])

  useEffect(() => {
    let activo = true
    let timer: ReturnType<typeof setTimeout>

    const tick = async () => {
      clearTimeout(timer)
      const seguir = await consultar()
      if (!seguir) activo = false
      if (!activo) return
      timer = setTimeout(tick, document.hidden ? POLL_OCULTO_MS : POLL_VISIBLE_MS)
    }
    const alVolver = () => {
      if (!document.hidden && activo) tick()
    }

    refrescarRef.current = () => {
      if (activo) tick()
    }
    tick()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      activo = false
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [consultar])

  // Al navegar (p. ej. tras cerrar una atención) el contador se pone al día sin esperar el ciclo.
  const primeraRuta = useRef(true)
  useEffect(() => {
    if (primeraRuta.current) {
      primeraRuta.current = false // la carga inicial ya la hace el efecto de consulta
      return
    }
    refrescarRef.current()
  }, [pathname])

  // "(3) Título" en la pestaña. Next reescribe el <title> al navegar, así que se vigila.
  useEffect(() => {
    const aplicar = () => {
      const base = document.title.replace(/^\(\d+\) /, '')
      const nuevo = total > 0 ? `(${total}) ${base}` : base
      if (document.title !== nuevo) document.title = nuevo
    }
    aplicar()
    const obs = new MutationObserver(aplicar)
    obs.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => obs.disconnect()
  }, [total])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 10_000)
    return () => clearTimeout(t)
  }, [aviso])

  const refrescar = useCallback(() => refrescarRef.current(), [])

  return (
    <PendientesContext.Provider value={{ total, contactos, habilitado, refrescar }}>
      {children}
      {aviso && (
        <div className="fixed bottom-4 right-4 z-[1100] flex w-80 max-w-[calc(100vw-2rem)] animate-scale-in items-start gap-3 rounded-2xl border border-red-100 bg-white p-4 shadow-soft-lg">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <BellRing size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-semibold text-slate-800">Cliente esperando abogado</p>
            <p className="mb-2 text-sm text-slate-600">{aviso.texto}</p>
            <Link
              href={aviso.href}
              onClick={() => setAviso(null)}
              className="text-sm font-medium text-blue-800 no-underline hover:underline"
            >
              Atender ahora →
            </Link>
          </div>
          <button
            onClick={() => setAviso(null)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </PendientesContext.Provider>
  )
}

/** Campana de la barra superior con la lista de clientes que esperan abogado. */
export function PendientesBotBell() {
  const { total, contactos, habilitado } = usePendientesBot()
  const [abierto, setAbierto] = useState(false)
  const [permiso, setPermiso] = useState<NotificationPermission | 'no-soportado'>('default')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPermiso(typeof Notification === 'undefined' ? 'no-soportado' : Notification.permission)
  }, [])

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  if (!habilitado) return null

  const activarNotificaciones = async () => {
    try {
      setPermiso(await Notification.requestPermission())
    } catch {
      setPermiso('denied')
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className={cn(
          'relative rounded-xl border p-1.5 transition-colors',
          total > 0
            ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
            : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        )}
        title={total > 0 ? `${total} cliente(s) esperando abogado` : 'Sin clientes esperando abogado'}
      >
        {total > 0 ? <BellRing size={20} /> : <Bell size={20} />}
        {total > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-bold text-white ring-2 ring-white">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full z-[1100] mt-2 w-80 animate-scale-in overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="mb-0 text-sm font-semibold text-slate-800">Esperando abogado</p>
            <p className="mb-0 text-xs text-slate-500">
              {total === 0 ? 'No hay clientes pendientes' : `${total} cliente${total !== 1 ? 's' : ''} por atender`}
            </p>
          </div>

          {contactos.length > 0 && (
            <ul className="max-h-80 overflow-y-auto">
              {contactos.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/bot/${c.id}`}
                    onClick={() => setAbierto(false)}
                    className="flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 text-slate-700 no-underline hover:bg-slate-50"
                  >
                    <MessageCircle size={16} className="shrink-0 text-red-500" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.nombre}</span>
                    <span className="shrink-0 text-xs text-slate-400">{haceCuanto(c.ultimoMensajeAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 bg-slate-50 px-4 py-3">
            {total > 0 && (
              <Link
                href={URL_PENDIENTES}
                onClick={() => setAbierto(false)}
                className="block text-sm font-medium text-blue-800 no-underline hover:underline"
              >
                Ver todos ({total}) →
              </Link>
            )}
            {permiso === 'default' && (
              <button onClick={activarNotificaciones} className="text-xs font-medium text-slate-600 hover:text-slate-900">
                🔔 Activar notificaciones del navegador
              </button>
            )}
            {permiso === 'denied' && (
              <p className="mb-0 text-xs text-slate-400">
                Notificaciones del navegador bloqueadas; actívelas en la configuración del sitio.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

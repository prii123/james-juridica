'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import Button, { buttonVariants } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  Scale,
  Gavel,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { EstadoAsesoria, TipoAudiencia } from '@prisma/client'

interface Asesoria {
  id: string
  tipo: string
  tema: string
  fecha: string
  duracion: number
  estado: EstadoAsesoria
  modalidad: string
  lead: {
    nombre: string
  }
  asesor: {
    nombre: string
    apellido: string
  }
}

interface Audiencia {
  id: string
  tipo: TipoAudiencia
  fechaHora: string
  estado: string
  caso?: {
    id: string
    numeroCaso: string
  }
}

interface CalendarEvent {
  id: string
  type: 'asesoria' | 'audiencia'
  title: string
  date: Date
  time: string
  estado: string
  data: Asesoria | Audiencia
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const TIPO_AUDIENCIA_LABELS = {
  RADICACION: 'Radicación',
  ADMISORIA: 'Admisoria',
  VERIFICACION_CREDITOS: 'Verificación de Créditos',
  CATEGORIA_CREDITOS: 'Categoría de Créditos',
  CONCORDATO: 'Concordato',
  OTRA: 'Otra'
}

const ESTADO_BADGE_VARIANT: Record<string, 'primary' | 'success' | 'danger' | 'warning'> = {
  PROGRAMADA: 'primary',
  REALIZADA: 'success',
  CANCELADA: 'danger',
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<{
    syncing: boolean
    lastSync: Date | null
    configured: boolean
    message: string
  }>({ syncing: false, lastSync: null, configured: false, message: '' })

  const triggerSync = useCallback(async () => {
    if (syncStatus.syncing) return
    setSyncStatus(prev => ({ ...prev, syncing: true, message: 'Sincronizando con Google Calendar...' }))
    try {
      const res = await fetch('/api/calendario/sync', { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        setSyncStatus(prev => ({
          ...prev,
          syncing: false,
          lastSync: new Date(),
          message: `Sincronizado: ${result.created} creados, ${result.updated} actualizados`,
        }))
      } else {
        setSyncStatus(prev => ({
          ...prev,
          syncing: false,
          message: `Error: ${result.errors?.join(', ') || 'Error al sincronizar'}`,
        }))
      }
    } catch {
      setSyncStatus(prev => ({
        ...prev,
        syncing: false,
        message: 'Error de conexión al sincronizar',
      }))
    }
  }, [syncStatus.syncing])

  useEffect(() => {
    fetch('/api/calendario/sync')
      .then(res => res.json())
      .then(data => {
        setSyncStatus(prev => ({ ...prev, configured: data.configured }))
        if (data.configured) {
          triggerSync()
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate])

  const fetchEvents = async () => {
    try {
      setLoading(true)

      // Obtener primer y último día del mes actual
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999)

      // Fetch asesorías
      const asesoriasResponse = await fetch('/api/asesorias?limit=1000')
      const audienciasResponse = await fetch('/api/audiencias?limit=1000')

      const allEvents: CalendarEvent[] = []

      if (asesoriasResponse.ok) {
        const asesoriasData = await asesoriasResponse.json()
        const asesorias = asesoriasData.asesorias || []

        asesorias.forEach((asesoria: Asesoria) => {
          const asesoriaDate = new Date(asesoria.fecha)
          if (asesoriaDate >= firstDay && asesoriaDate <= lastDay) {
            allEvents.push({
              id: asesoria.id,
              type: 'asesoria',
              title: asesoria.tema,
              date: asesoriaDate,
              time: asesoriaDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
              estado: asesoria.estado,
              data: asesoria
            })
          }
        })
      }

      if (audienciasResponse.ok) {
        const audienciasData = await audienciasResponse.json()
        const audiencias = audienciasData.data || audienciasData.audiencias || []

        audiencias.forEach((audiencia: Audiencia) => {
          const audienciaDate = new Date(audiencia.fechaHora)
          if (audienciaDate >= firstDay && audienciaDate <= lastDay) {
            allEvents.push({
              id: audiencia.id,
              type: 'audiencia',
              title: audiencia.caso ? `Caso ${audiencia.caso.numeroCaso}` : 'Audiencia',
              date: audienciaDate,
              time: audienciaDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
              estado: audiencia.estado,
              data: audiencia
            })
          }
        })
      }

      // Ordenar eventos por fecha
      allEvents.sort((a, b) => a.date.getTime() - b.date.getTime())
      setEvents(allEvents)

    } catch (error) {
      console.error('Error al cargar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []

    // Días vacíos antes del primer día del mes
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      return event.date.getDate() === date.getDate() &&
             event.date.getMonth() === date.getMonth() &&
             event.date.getFullYear() === date.getFullYear()
    })
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const days = getDaysInMonth()
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Calendario' }
        ]}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Calendario de Eventos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Visualiza y gestiona todos tus eventos: asesorías, audiencias y más
          </p>
          {syncStatus.configured && (
            <div className="mt-1.5 flex items-center gap-2">
              {syncStatus.syncing ? (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <RefreshCw size={12} className="animate-spin" /> Sincronizando...
                </span>
              ) : syncStatus.lastSync ? (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <CheckCircle2 size={12} className="text-teal-700" />
                  Última sincronización: {syncStatus.lastSync.toLocaleTimeString('es-CO')}
                </span>
              ) : null}
              {syncStatus.message && !syncStatus.syncing && syncStatus.message.startsWith('Error') && (
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {syncStatus.message}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {syncStatus.configured && (
            <Button
              variant="outline"
              onClick={triggerSync}
              disabled={syncStatus.syncing}
            >
              <RefreshCw size={16} className={syncStatus.syncing ? 'animate-spin' : ''} />
              Sincronizar
            </Button>
          )}
          <Link href="/asesorias/nueva" className={buttonVariants({ variant: 'primary' })}>
            <Plus size={16} />
            Nueva Asesoría
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-slate-400" />
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Mes anterior">
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outlinePrimary" size="sm" onClick={handleToday}>
                  Hoy
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Mes siguiente">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {loading ? (
                <Spinner />
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[640px]">
                    <div className="grid grid-cols-7 border-b border-slate-100">
                      {DAYS.map(day => (
                        <div key={day} className="py-2.5 text-center text-xs font-semibold text-slate-500">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {days.map((date, index) => {
                        if (!date) {
                          return <div key={index} className="h-[110px] border-b border-r border-slate-100 bg-slate-50/40" />
                        }

                        const dayEvents = getEventsForDate(date)
                        const isTodayDate = isToday(date)
                        const isSelected = selectedDate &&
                          date.getDate() === selectedDate.getDate() &&
                          date.getMonth() === selectedDate.getMonth() &&
                          date.getFullYear() === selectedDate.getFullYear()

                        return (
                          <div
                            key={index}
                            onClick={() => dayEvents.length > 0 && setSelectedDate(date)}
                            className={cn(
                              'h-[110px] border-b border-r border-slate-100 p-2 align-top transition-colors',
                              dayEvents.length > 0 ? 'cursor-pointer hover:bg-slate-50' : '',
                              isTodayDate && 'bg-blue-50/60',
                              isSelected && 'ring-2 ring-inset ring-blue-700'
                            )}
                          >
                            <div className={cn('mb-1 text-xs font-semibold', isTodayDate ? 'text-blue-800' : 'text-slate-600')}>
                              {date.getDate()}
                            </div>
                            <div className="flex flex-col gap-1">
                              {dayEvents.slice(0, 3).map(event => (
                                <div
                                  key={event.id}
                                  title={`${event.time} - ${event.title}`}
                                  className={cn(
                                    'flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium',
                                    event.type === 'asesoria'
                                      ? 'bg-sky-50 text-sky-700'
                                      : 'bg-amber-50 text-amber-700'
                                  )}
                                >
                                  {event.type === 'asesoria' ? <User size={10} /> : <Gavel size={10} />} {event.time}
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-600">
                                  +{dayEvents.length - 3} más
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? `Eventos del ${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`
                  : 'Selecciona una fecha'
                }
              </CardTitle>
            </CardHeader>
            <CardBody className="max-h-[600px] overflow-y-auto">
              {selectedDateEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CalendarIcon size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {selectedDate
                      ? 'No hay eventos programados para este día'
                      : 'Selecciona un día con eventos en el calendario'
                    }
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedDateEvents.map(event => {
                    if (event.type === 'asesoria') {
                      const asesoria = event.data as Asesoria
                      return (
                        <Link key={event.id} href={`/asesorias/${asesoria.id}`}>
                          <div className="rounded-xl border border-slate-200 border-l-4 border-l-sky-500 bg-white p-3.5 transition-shadow hover:shadow-soft-md">
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <User size={16} className="text-sky-600" />
                                <Badge variant="info">Asesoría</Badge>
                              </div>
                              <Badge variant={ESTADO_BADGE_VARIANT[asesoria.estado] || 'warning'}>
                                {asesoria.estado}
                              </Badge>
                            </div>
                            <h6 className="mb-2 text-sm font-semibold text-slate-800">{asesoria.tema}</h6>
                            <div className="space-y-1 text-xs text-slate-500">
                              <div className="flex items-center gap-2">
                                <Clock size={13} />
                                <span>{event.time} ({asesoria.duracion} min)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User size={13} />
                                <span>{asesoria.lead.nombre}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin size={13} />
                                <span>{asesoria.modalidad}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    } else {
                      const audiencia = event.data as Audiencia
                      return (
                        <Link key={event.id} href={`/casos/${audiencia.caso?.id}/audiencias`}>
                          <div className="rounded-xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-3.5 transition-shadow hover:shadow-soft-md">
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Gavel size={16} className="text-amber-600" />
                                <Badge variant="warning">Audiencia</Badge>
                              </div>
                              <Badge variant={ESTADO_BADGE_VARIANT[audiencia.estado] || 'warning'}>
                                {audiencia.estado}
                              </Badge>
                            </div>
                            <h6 className="mb-2 text-sm font-semibold text-slate-800">{event.title}</h6>
                            <div className="space-y-1 text-xs text-slate-500">
                              <div className="flex items-center gap-2">
                                <Clock size={13} />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Scale size={13} />
                                <span>{TIPO_AUDIENCIA_LABELS[audiencia.tipo] || audiencia.tipo}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    }
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Resumen del Mes</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-sky-50 p-4 text-center">
                  <User size={22} className="mx-auto mb-2 text-sky-600" />
                  <div className="text-xl font-bold text-slate-900">
                    {events.filter(e => e.type === 'asesoria').length}
                  </div>
                  <div className="text-xs text-slate-500">Asesorías</div>
                </div>
                <div className="rounded-xl bg-amber-50 p-4 text-center">
                  <Gavel size={22} className="mx-auto mb-2 text-amber-600" />
                  <div className="text-xl font-bold text-slate-900">
                    {events.filter(e => e.type === 'audiencia').length}
                  </div>
                  <div className="text-xs text-slate-500">Audiencias</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

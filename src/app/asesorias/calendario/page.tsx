'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
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
  List
} from 'lucide-react'
import { EstadoAsesoria, TipoAudiencia } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Spinner, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

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

const TIPO_AUDIENCIA_LABELS: Record<string, string> = {
  RADICACION: 'Radicación',
  ADMISORIA: 'Admisoria',
  VERIFICACION_CREDITOS: 'Verificación de Créditos',
  CATEGORIA_CREDITOS: 'Categoría de Créditos',
  CONCORDATO: 'Concordato',
  OTRA: 'Otra'
}

const ESTADO_BADGE: Record<string, BadgeProps['variant']> = {
  PROGRAMADA: 'primary',
  REALIZADA: 'success',
  CANCELADA: 'danger',
}

function getEstadoBadge(estado: string): BadgeProps['variant'] {
  return ESTADO_BADGE[estado] || 'warning'
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [currentDate])

  const fetchEvents = async () => {
    try {
      setLoading(true)

      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

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
        const audiencias = audienciasData.audiencias || []

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

    const days: (Date | null)[] = []

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

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
          { label: 'Asesorías', href: '/asesorias' },
          { label: 'Calendario' }
        ]}
      />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Calendario de Eventos</h1>
          <p className="mb-0 text-slate-500">
            Visualiza asesorías y audiencias programadas
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/asesorias">
            <Button variant="outline">
              <List size={16} />
              Ver Lista
            </Button>
          </Link>
          <Link href="/asesorias/nueva">
            <Button>
              <Plus size={16} />
              Nueva Asesoría
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon size={20} />
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outlinePrimary" size="sm" onClick={handleToday}>
                  Hoy
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {loading ? (
                <Spinner />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-collapse">
                    <thead>
                      <tr>
                        {DAYS.map(day => (
                          <th key={day} className="w-[14.28%] border border-slate-200 bg-slate-50 py-2 text-center text-xs font-semibold text-slate-500">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
                        <tr key={weekIndex}>
                          {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                            if (!date) {
                              return <td key={dayIndex} className="border border-slate-200 bg-slate-50" />
                            }

                            const dayEvents = getEventsForDate(date)
                            const isTodayDate = isToday(date)
                            const isSelected = selectedDate &&
                              date.getDate() === selectedDate.getDate() &&
                              date.getMonth() === selectedDate.getMonth() &&
                              date.getFullYear() === selectedDate.getFullYear()

                            return (
                              <td
                                key={dayIndex}
                                className={cn(
                                  'relative h-[120px] border border-slate-200 p-2 align-top',
                                  isTodayDate && 'bg-blue-50',
                                  isSelected && 'border-2 border-blue-800',
                                  dayEvents.length > 0 ? 'cursor-pointer' : ''
                                )}
                                onClick={() => dayEvents.length > 0 && setSelectedDate(date)}
                              >
                                <div className={cn('mb-1 text-sm font-bold', isTodayDate ? 'text-blue-800' : 'text-slate-700')}>
                                  {date.getDate()}
                                </div>
                                <div className="flex flex-col gap-1" style={{ fontSize: '0.7rem' }}>
                                  {dayEvents.slice(0, 3).map(event => (
                                    <div
                                      key={event.id}
                                      className={cn(
                                        'flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-white',
                                        event.type === 'asesoria' ? 'bg-sky-600' : 'bg-amber-500'
                                      )}
                                      title={`${event.time} - ${event.title}`}
                                    >
                                      {event.type === 'asesoria' ? <User size={10} /> : <Gavel size={10} />} {event.time}
                                    </div>
                                  ))}
                                  {dayEvents.length > 3 && (
                                    <div className="rounded bg-slate-500 px-1.5 py-0.5 text-white">
                                      +{dayEvents.length - 3} más
                                    </div>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? `Eventos del ${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`
                  : 'Selecciona una fecha'
                }
              </CardTitle>
            </CardHeader>
            <CardBody className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {selectedDateEvents.length === 0 ? (
                <div className="py-4 text-center text-slate-500">
                  <CalendarIcon size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="mb-0">
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
                        <Link key={event.id} href={`/asesorias/${asesoria.id}`} className="no-underline">
                          <Card className="h-full border-l-4 border-l-sky-600">
                            <CardBody className="p-3">
                              <div className="mb-2 flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <User size={16} className="text-sky-700" />
                                  <Badge variant="info">Asesoría</Badge>
                                </div>
                                <Badge variant={getEstadoBadge(asesoria.estado)}>{asesoria.estado}</Badge>
                              </div>
                              <h6 className="mb-2 font-semibold text-slate-800">{asesoria.tema}</h6>
                              <div className="space-y-1 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                  <Clock size={14} />
                                  <span>{event.time} ({asesoria.duracion} min)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User size={14} />
                                  <span>{asesoria.lead.nombre}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin size={14} />
                                  <span>{asesoria.modalidad}</span>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </Link>
                      )
                    } else {
                      const audiencia = event.data as Audiencia
                      return (
                        <Link key={event.id} href={`/casos/${audiencia.caso?.id}/audiencias`} className="no-underline">
                          <Card className="h-full border-l-4 border-l-amber-500">
                            <CardBody className="p-3">
                              <div className="mb-2 flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <Gavel size={16} className="text-amber-600" />
                                  <Badge variant="warning">Audiencia</Badge>
                                </div>
                                <Badge variant={getEstadoBadge(audiencia.estado)}>{audiencia.estado}</Badge>
                              </div>
                              <h6 className="mb-2 font-semibold text-slate-800">{event.title}</h6>
                              <div className="space-y-1 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                  <Clock size={14} />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Scale size={14} />
                                  <span>{TIPO_AUDIENCIA_LABELS[audiencia.tipo] || audiencia.tipo}</span>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </Link>
                      )
                    }
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Resumen de eventos del mes */}
          <Card>
            <CardHeader><CardTitle>Resumen del Mes</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-sky-50 p-3 text-center">
                  <User size={24} className="mx-auto mb-2 text-sky-700" />
                  <div className="text-2xl font-bold text-slate-800">
                    {events.filter(e => e.type === 'asesoria').length}
                  </div>
                  <div className="text-sm text-slate-500">Asesorías</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <Gavel size={24} className="mx-auto mb-2 text-amber-600" />
                  <div className="text-2xl font-bold text-slate-800">
                    {events.filter(e => e.type === 'audiencia').length}
                  </div>
                  <div className="text-sm text-slate-500">Audiencias</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

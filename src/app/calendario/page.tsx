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
  Plus
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
      
      // Obtener primer y último día del mes actual
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

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

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Calendario de Eventos</h1>
          <p className="text-secondary mb-0">
            Visualiza y gestiona todos tus eventos: asesorías, audiencias y más
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/asesorias/nueva" className="btn btn-primary d-flex align-items-center gap-2">
            <Plus size={16} />
            Nueva Asesoría
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <CalendarIcon size={20} />
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h5>
                <div className="d-flex gap-2">
                  <button 
                    onClick={handlePrevMonth}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleToday}
                    className="btn btn-outline-primary btn-sm"
                  >
                    Hoy
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered mb-0" style={{ tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        {DAYS.map(day => (
                          <th key={day} className="text-center bg-light py-2" style={{ width: '14.28%' }}>
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
                              return <td key={dayIndex} className="bg-light"></td>
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
                                className={`p-2 align-top ${isTodayDate ? 'bg-primary bg-opacity-10' : ''} ${isSelected ? 'border-primary border-2' : ''}`}
                                style={{ 
                                  height: '120px', 
                                  cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                                  position: 'relative'
                                }}
                                onClick={() => dayEvents.length > 0 && setSelectedDate(date)}
                              >
                                <div className={`fw-bold small mb-1 ${isTodayDate ? 'text-primary' : ''}`}>
                                  {date.getDate()}
                                </div>
                                <div className="d-flex flex-column gap-1" style={{ fontSize: '0.7rem' }}>
                                  {dayEvents.slice(0, 3).map(event => (
                                    <div 
                                      key={event.id}
                                      className={`badge ${
                                        event.type === 'asesoria' 
                                          ? 'bg-info' 
                                          : 'bg-warning'
                                      } text-start text-truncate`}
                                      title={`${event.time} - ${event.title}`}
                                    >
                                      {event.type === 'asesoria' ? <User size={10} /> : <Gavel size={10} />} {event.time}
                                    </div>
                                  ))}
                                  {dayEvents.length > 3 && (
                                    <div className="badge bg-secondary text-start">
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
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                {selectedDate 
                  ? `Eventos del ${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`
                  : 'Selecciona una fecha'
                }
              </h5>
            </div>
            <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {selectedDateEvents.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <CalendarIcon size={48} className="mb-3 opacity-50" />
                  <p className="mb-0">
                    {selectedDate 
                      ? 'No hay eventos programados para este día'
                      : 'Selecciona un día con eventos en el calendario'
                    }
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {selectedDateEvents.map(event => {
                    if (event.type === 'asesoria') {
                      const asesoria = event.data as Asesoria
                      return (
                        <Link
                          key={event.id}
                          href={`/asesorias/${asesoria.id}`}
                          className="text-decoration-none"
                        >
                          <div className="card border-start border-info border-4 h-100">
                            <div className="card-body p-3">
                              <div className="d-flex align-items-start justify-content-between mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <User size={16} className="text-info" />
                                  <span className="badge bg-info">Asesoría</span>
                                </div>
                                <span className={`badge ${
                                  asesoria.estado === 'PROGRAMADA' ? 'bg-primary' :
                                  asesoria.estado === 'REALIZADA' ? 'bg-success' :
                                  asesoria.estado === 'CANCELADA' ? 'bg-danger' :
                                  'bg-warning'
                                }`}>
                                  {asesoria.estado}
                                </span>
                              </div>
                              <h6 className="mb-2">{asesoria.tema}</h6>
                              <div className="small text-muted">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <Clock size={14} />
                                  <span>{event.time} ({asesoria.duracion} min)</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <User size={14} />
                                  <span>{asesoria.lead.nombre}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <MapPin size={14} />
                                  <span>{asesoria.modalidad}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    } else {
                      const audiencia = event.data as Audiencia
                      return (
                        <Link
                          key={event.id}
                          href={`/casos/${audiencia.caso?.id}/audiencias`}
                          className="text-decoration-none"
                        >
                          <div className="card border-start border-warning border-4 h-100">
                            <div className="card-body p-3">
                              <div className="d-flex align-items-start justify-content-between mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <Gavel size={16} className="text-warning" />
                                  <span className="badge bg-warning text-dark">Audiencia</span>
                                </div>
                                <span className={`badge ${
                                  audiencia.estado === 'PROGRAMADA' ? 'bg-primary' :
                                  audiencia.estado === 'REALIZADA' ? 'bg-success' :
                                  audiencia.estado === 'CANCELADA' ? 'bg-danger' :
                                  'bg-warning'
                                }`}>
                                  {audiencia.estado}
                                </span>
                              </div>
                              <h6 className="mb-2">{event.title}</h6>
                              <div className="small text-muted">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <Clock size={14} />
                                  <span>{event.time}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <Scale size={14} />
                                  <span>{TIPO_AUDIENCIA_LABELS[audiencia.tipo] || audiencia.tipo}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    }
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Resumen de eventos del mes */}
          <div className="card mt-3">
            <div className="card-header">
              <h5 className="mb-0">Resumen del Mes</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6">
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <User size={24} className="text-info mb-2" />
                    <div className="h4 mb-0">
                      {events.filter(e => e.type === 'asesoria').length}
                    </div>
                    <div className="small text-muted">Asesorías</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <Gavel size={24} className="text-warning mb-2" />
                    <div className="h4 mb-0">
                      {events.filter(e => e.type === 'audiencia').length}
                    </div>
                    <div className="small text-muted">Audiencias</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

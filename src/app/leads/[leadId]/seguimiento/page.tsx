'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  User,
  Clock,
  Edit,
  Trash2
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface SeguimientoItem {
  id: string
  tipo: 'LLAMADA' | 'EMAIL' | 'REUNION' | 'NOTA' | 'WHATSAPP'
  descripcion: string
  fecha: Date
  duracion?: number | null
  resultado?: string | null
  proximoSeguimiento?: Date | null
  usuario: {
    id: string
    nombre: string
    apellido: string
  }
}

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  estado: string
}

type TipoSeguimiento = 'LLAMADA' | 'EMAIL' | 'REUNION' | 'NOTA' | 'WHATSAPP'

interface NewSeguimientoForm {
  tipo: TipoSeguimiento
  descripcion: string
  duracion: string
  resultado: string
  proximoSeguimiento: string
}

const TIPO_STYLES: Record<TipoSeguimiento, { icon: string; border: string }> = {
  LLAMADA: { icon: 'text-teal-700', border: 'border-l-teal-600' },
  EMAIL: { icon: 'text-blue-800', border: 'border-l-blue-800' },
  REUNION: { icon: 'text-amber-500', border: 'border-l-amber-500' },
  WHATSAPP: { icon: 'text-sky-700', border: 'border-l-sky-600' },
  NOTA: { icon: 'text-slate-500', border: 'border-l-slate-400' },
}

export default function LeadSeguimientoPage() {
  const params = useParams()
  const leadId = params.leadId as string

  const [seguimientos, setSeguimientos] = useState<SeguimientoItem[]>([])
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSeguimiento, setEditingSeguimiento] = useState<SeguimientoItem | null>(null)
  const [newSeguimiento, setNewSeguimiento] = useState<NewSeguimientoForm>({
    tipo: 'NOTA',
    descripcion: '',
    duracion: '',
    resultado: '',
    proximoSeguimiento: ''
  })

  useEffect(() => {
    if (leadId) {
      fetchData()
    }
  }, [leadId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch lead data
      const leadResponse = await fetch(`/api/leads/${leadId}`)
      if (leadResponse.ok) {
        const leadData = await leadResponse.json()
        setLead(leadData)
      }

      // Fetch seguimientos
      const seguimientosResponse = await fetch(`/api/leads/${leadId}/seguimiento`)
      if (seguimientosResponse.ok) {
        const seguimientosData = await seguimientosResponse.json()
        setSeguimientos(seguimientosData)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const seguimientoData = {
      tipo: newSeguimiento.tipo,
      descripcion: newSeguimiento.descripcion,
      duracion: newSeguimiento.duracion ? parseInt(newSeguimiento.duracion) : null,
      resultado: newSeguimiento.resultado || null,
      proximoSeguimiento: newSeguimiento.proximoSeguimiento ? new Date(newSeguimiento.proximoSeguimiento) : null,
    }

    try {
      const response = await fetch(`/api/leads/${leadId}/seguimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seguimientoData)
      })

      if (response.ok) {
        fetchData()
        setShowForm(false)
        setNewSeguimiento({
          tipo: 'NOTA',
          descripcion: '',
          duracion: '',
          resultado: '',
          proximoSeguimiento: ''
        })
      } else {
        const errorData = await response.json()
        console.error('Error al guardar seguimiento:', errorData)
        alert('Error al guardar seguimiento: ' + errorData.error)
      }
    } catch (error) {
      console.error('Error al guardar seguimiento:', error)
      alert('Error de conexión al guardar seguimiento')
    }
  }

  const handleEdit = (seguimiento: SeguimientoItem) => {
    setEditingSeguimiento(seguimiento)
    setNewSeguimiento({
      tipo: seguimiento.tipo,
      descripcion: seguimiento.descripcion,
      duracion: seguimiento.duracion?.toString() || '',
      resultado: seguimiento.resultado || '',
      proximoSeguimiento: seguimiento.proximoSeguimiento ?
        new Date(seguimiento.proximoSeguimiento).toISOString().slice(0, 16) : ''
    })
    setShowForm(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingSeguimiento) return

    const seguimientoData = {
      tipo: newSeguimiento.tipo,
      descripcion: newSeguimiento.descripcion,
      duracion: newSeguimiento.duracion ? parseInt(newSeguimiento.duracion) : null,
      resultado: newSeguimiento.resultado || null,
      proximoSeguimiento: newSeguimiento.proximoSeguimiento ? new Date(newSeguimiento.proximoSeguimiento) : null,
    }

    try {
      const response = await fetch(`/api/leads/${leadId}/seguimiento/${editingSeguimiento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seguimientoData)
      })

      if (response.ok) {
        fetchData()
        setShowForm(false)
        setEditingSeguimiento(null)
        setNewSeguimiento({
          tipo: 'NOTA',
          descripcion: '',
          duracion: '',
          resultado: '',
          proximoSeguimiento: ''
        })
      } else {
        const errorData = await response.json()
        console.error('Error al actualizar seguimiento:', errorData)
        alert('Error al actualizar seguimiento: ' + errorData.error)
      }
    } catch (error) {
      console.error('Error al actualizar seguimiento:', error)
      alert('Error de conexión al actualizar seguimiento')
    }
  }

  const handleDelete = async (seguimientoId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este seguimiento?')) {
      return
    }

    try {
      const response = await fetch(`/api/leads/${leadId}/seguimiento/${seguimientoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchData()
      } else {
        const errorData = await response.json()
        console.error('Error al eliminar seguimiento:', errorData)
        alert('Error al eliminar seguimiento: ' + errorData.error)
      }
    } catch (error) {
      console.error('Error al eliminar seguimiento:', error)
      alert('Error de conexión al eliminar seguimiento')
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingSeguimiento(null)
    setNewSeguimiento({
      tipo: 'NOTA',
      descripcion: '',
      duracion: '',
      resultado: '',
      proximoSeguimiento: ''
    })
  }

  const getTipoIcon = (tipo: TipoSeguimiento) => {
    const cls = TIPO_STYLES[tipo].icon
    switch (tipo) {
      case 'LLAMADA': return <Phone size={16} className={cls} />
      case 'EMAIL': return <Mail size={16} className={cls} />
      case 'REUNION': return <Calendar size={16} className={cls} />
      case 'WHATSAPP': return <MessageSquare size={16} className={cls} />
      case 'NOTA': return <Edit size={16} className={cls} />
      default: return <MessageSquare size={16} className={cls} />
    }
  }

  if (loading) {
    return <Spinner />
  }

  if (!lead) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">Lead no encontrado</Alert>
        <Link href="/leads">
          <Button>Volver a Leads</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Leads', href: '/leads' },
          { label: lead.nombre, href: `/leads/${leadId}` },
          { label: 'Seguimiento' }
        ]}
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/leads/${leadId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-800">Seguimiento</h1>
            <p className="mb-0 text-slate-500">
              Historial de interacciones con {lead.nombre}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} />
          Nuevo Seguimiento
        </Button>
      </div>

      {/* Formulario de nuevo seguimiento */}
      {showForm && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{editingSeguimiento ? 'Editar Seguimiento' : 'Nuevo Seguimiento'}</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={editingSeguimiento ? handleUpdate : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Tipo de Seguimiento</Label>
                  <Select
                    value={newSeguimiento.tipo}
                    onChange={(e) => setNewSeguimiento({
                      ...newSeguimiento,
                      tipo: e.target.value as TipoSeguimiento
                    })}
                    required
                  >
                    <option value="NOTA">Nota</option>
                    <option value="LLAMADA">Llamada</option>
                    <option value="EMAIL">Email</option>
                    <option value="REUNION">Reunión</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </Select>
                </div>
                {(newSeguimiento.tipo === 'LLAMADA' || newSeguimiento.tipo === 'REUNION') && (
                  <div>
                    <Label>Duración (minutos)</Label>
                    <Input
                      type="number"
                      value={newSeguimiento.duracion}
                      onChange={(e) => setNewSeguimiento({
                        ...newSeguimiento,
                        duracion: e.target.value
                      })}
                      placeholder="15"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Descripción *</Label>
                <Textarea
                  rows={3}
                  value={newSeguimiento.descripcion}
                  onChange={(e) => setNewSeguimiento({
                    ...newSeguimiento,
                    descripcion: e.target.value
                  })}
                  placeholder="Describe la interacción..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Resultado</Label>
                  <Input
                    type="text"
                    value={newSeguimiento.resultado}
                    onChange={(e) => setNewSeguimiento({
                      ...newSeguimiento,
                      resultado: e.target.value
                    })}
                    placeholder="Resultado de la interacción"
                  />
                </div>
                <div>
                  <Label>Próximo Seguimiento</Label>
                  <Input
                    type="datetime-local"
                    value={newSeguimiento.proximoSeguimiento}
                    onChange={(e) => setNewSeguimiento({
                      ...newSeguimiento,
                      proximoSeguimiento: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingSeguimiento ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Timeline de seguimientos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {seguimientos.length === 0 ? (
            <Card>
              <CardBody className="py-5 text-center">
                <MessageSquare size={64} className="mx-auto mb-3 text-slate-300" />
                <h4 className="text-lg font-semibold text-slate-800">No hay seguimientos registrados</h4>
                <p className="mb-4 text-slate-500">
                  Comienza a registrar las interacciones con este lead.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  Crear Primer Seguimiento
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div>
              {seguimientos.map((seguimiento) => (
                <Card key={seguimiento.id} className={cn('mb-3 border-l-4', TIPO_STYLES[seguimiento.tipo].border)}>
                  <CardBody>
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(seguimiento.tipo)}
                        <strong>{seguimiento.tipo}</strong>
                        {seguimiento.duracion && (
                          <small className="text-slate-500">
                            ({seguimiento.duracion} min)
                          </small>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <small className="text-slate-500">
                          {new Date(seguimiento.fecha).toLocaleString()}
                        </small>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(seguimiento)}
                          title="Editar seguimiento"
                        >
                          <Edit size={12} />
                        </Button>
                        <Button
                          variant="outlineDanger"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDelete(seguimiento.id)}
                          title="Eliminar seguimiento"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>

                    <p className="mb-2">{seguimiento.descripcion}</p>

                    {seguimiento.resultado && (
                      <div className="mb-2">
                        <small className="text-teal-700">
                          <strong>Resultado:</strong> {seguimiento.resultado}
                        </small>
                      </div>
                    )}

                    {seguimiento.proximoSeguimiento && (
                      <div className="mb-2 flex items-center gap-1">
                        <Clock size={12} className="text-amber-500" />
                        <small className="text-amber-600">
                          <strong>Próximo seguimiento:</strong> {new Date(seguimiento.proximoSeguimiento).toLocaleString()}
                        </small>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      <small className="text-slate-500">
                        {seguimiento.usuario.nombre} {seguimiento.usuario.apellido}
                      </small>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-4">
          {/* Acciones rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-2">
              <a href={`tel:${lead.telefono}`}>
                <Button variant="outline" size="sm" className="w-full justify-center border-teal-700 text-teal-700 hover:bg-teal-50">
                  <Phone size={14} />
                  Llamar
                </Button>
              </a>
              <a href={`mailto:${lead.email}`}>
                <Button variant="outlinePrimary" size="sm" className="w-full justify-center">
                  <Mail size={14} />
                  Enviar Email
                </Button>
              </a>
              <a href={`https://wa.me/${lead.telefono.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full justify-center border-sky-700 text-sky-700 hover:bg-sky-50">
                  <MessageSquare size={14} />
                  WhatsApp
                </Button>
              </a>
            </CardBody>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="mb-3 text-center">
                <div className="text-2xl font-bold text-blue-800">{seguimientos.length}</div>
                <small className="text-slate-500">Total Interacciones</small>
              </div>
              <hr className="mb-3 border-slate-200" />
              <div className="space-y-1 text-sm">
                {Object.entries(seguimientos.reduce((acc, s) => {
                  acc[s.tipo] = (acc[s.tipo] || 0) + 1
                  return acc
                }, {} as Record<string, number>)).map(([tipo, count]) => (
                  <div key={tipo} className="flex justify-between">
                    <span>{tipo}:</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

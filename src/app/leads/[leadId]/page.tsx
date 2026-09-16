'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  User,
  Building2,
  Calendar,
  FileText,
  MessageSquare,
  Plus,
  Eye
} from 'lucide-react'
import { EstadoLead, TipoPersona } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Spinner, type BadgeProps } from '@/components/ui'

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa?: string | null
  tipoPersona: TipoPersona
  documento?: string | null
  estado: EstadoLead
  origen?: string | null
  observaciones?: string | null
  fechaSeguimiento?: Date | null
  createdAt: Date
  updatedAt: Date
  responsable?: {
    id: string
    nombre: string
    apellido: string
    email: string
  } | null
  asesorias: Array<{
    id: string
    tipo: string
    estado: string
    fecha: Date
    tema: string
    asesor: {
      nombre: string
      apellido: string
    }
  }>
}

const ESTADO_BADGE_VARIANT: Record<EstadoLead, BadgeProps['variant']> = {
  NUEVO: 'primary',
  CONTACTADO: 'info',
  CALIFICADO: 'warning',
  CONVERTIDO: 'success',
  PERDIDO: 'danger',
}

export default function LeadDetailPage() {
  const params = useParams()
  const leadId = params.leadId as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (leadId) {
      fetchLead()
    }
  }, [leadId])

  const fetchLead = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leads/${leadId}`)
      if (response.ok) {
        const data = await response.json()
        setLead(data)
      } else if (response.status === 404) {
        setError('Lead no encontrado')
      } else {
        setError('Error al cargar el lead')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const getTipoPersonaIcon = (tipo: TipoPersona) => {
    return tipo === 'NATURAL' ? <User size={16} /> : <Building2 size={16} />
  }

  const updateEstado = async (nuevoEstado: EstadoLead) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        // Update only the estado field, preserve other data including asesorias
        setLead(prevLead =>
          prevLead ? { ...prevLead, estado: nuevoEstado } : null
        )
      } else {
        console.error('Error al actualizar estado del lead')
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error)
    }
  }

  if (loading) {
    return <Spinner />
  }

  if (error || !lead) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4 justify-center text-center">
          {error || 'Lead no encontrado'}
        </Alert>
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
          { label: lead.nombre }
        ]}
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="outline" size="icon">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <div className="mb-1 flex items-center gap-2">
              {getTipoPersonaIcon(lead.tipoPersona)}
              <h1 className="mb-0 text-2xl font-bold text-slate-800">{lead.nombre}</h1>
              <Badge variant={ESTADO_BADGE_VARIANT[lead.estado]}>{lead.estado}</Badge>
            </div>
            <p className="mb-0 text-slate-500">{lead.empresa || 'Sin empresa'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/leads/${leadId}/asesorias/nueva`}>
            <Button variant="success">
              <Plus size={16} />
              Nueva Asesoría
            </Button>
          </Link>
          <Link href={`/leads/${leadId}/editar`}>
            <Button variant="outlinePrimary">
              <Edit size={16} />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {/* Información del Lead */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Lead</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Mail size={16} className="text-blue-800" />
                      <strong>Email:</strong>
                    </div>
                    <p className="mb-0">{lead.email}</p>
                  </div>
                  <div className="mb-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Phone size={16} className="text-blue-800" />
                      <strong>Teléfono:</strong>
                    </div>
                    <p className="mb-0">{lead.telefono}</p>
                  </div>
                  {lead.documento && (
                    <div className="mb-3">
                      <div className="mb-1 flex items-center gap-2">
                        <FileText size={16} className="text-blue-800" />
                        <strong>Documento:</strong>
                      </div>
                      <p className="mb-0">{lead.documento}</p>
                    </div>
                  )}
                </div>
                <div>
                  {lead.origen && (
                    <div className="mb-3">
                      <strong>Origen:</strong>
                      <p className="mb-0">{lead.origen}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <strong>Fecha de Creación:</strong>
                    <p className="mb-0">{new Date(lead.createdAt).toLocaleString()}</p>
                  </div>
                  {lead.responsable && (
                    <div className="mb-3">
                      <strong>Responsable:</strong>
                      <p className="mb-0">{lead.responsable.nombre} {lead.responsable.apellido}</p>
                    </div>
                  )}
                </div>
              </div>
              {lead.observaciones && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-800" />
                    <strong>Observaciones:</strong>
                  </div>
                  <p className="mb-0">{lead.observaciones}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Asesorías */}
          <Card>
            <CardHeader>
              <CardTitle>Asesorías</CardTitle>
              <Link href={`/leads/${leadId}/asesorias/nueva`}>
                <Button size="sm">
                  <Plus size={14} /> Nueva
                </Button>
              </Link>
            </CardHeader>
            <CardBody>
              {!lead.asesorias || lead.asesorias.length === 0 ? (
                <div className="py-4 text-center">
                  <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="mb-3 text-slate-500">No hay asesorías registradas</p>
                  <Link href={`/leads/${leadId}/asesorias/nueva`}>
                    <Button size="sm">Programar Primera Asesoría</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {lead.asesorias.map((asesoria) => (
                    <div key={asesoria.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <h6 className="mb-1 font-semibold text-slate-800">{asesoria.tema}</h6>
                        <p className="mb-1 text-sm text-slate-500">
                          <strong>Tipo:</strong> {asesoria.tipo} |{' '}
                          <strong>Estado:</strong> {asesoria.estado} |{' '}
                          <strong>Asesor:</strong> {asesoria.asesor.nombre} {asesoria.asesor.apellido}
                        </p>
                        <small className="text-slate-500">
                          {new Date(asesoria.fecha).toLocaleString()}
                        </small>
                      </div>
                      <Link href={`/asesorias/${asesoria.id}`}>
                        <Button variant="outlinePrimary" size="icon">
                          <Eye size={14} />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-2">
              <Link href={`/leads/${leadId}/asesorias`}>
                <Button variant="outlinePrimary" className="w-full justify-center">
                  <Calendar size={16} />
                  Ver Asesorías
                </Button>
              </Link>
              <Link href={`/leads/${leadId}/seguimiento`}>
                <Button variant="outline" className="w-full justify-center border-sky-700 text-sky-700 hover:bg-sky-50">
                  <MessageSquare size={16} />
                  Seguimiento
                </Button>
              </Link>
              <a href={`tel:${lead.telefono}`}>
                <Button variant="outline" className="w-full justify-center border-teal-700 text-teal-700 hover:bg-teal-50">
                  <Phone size={16} />
                  Llamar
                </Button>
              </a>
              <a href={`mailto:${lead.email}`}>
                <Button variant="outline" className="w-full justify-center border-amber-500 text-amber-600 hover:bg-amber-50">
                  <Mail size={16} />
                  Enviar Email
                </Button>
              </a>
            </CardBody>
          </Card>

          {/* Cambiar Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Lead</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="mb-3">
                <Badge variant={ESTADO_BADGE_VARIANT[lead.estado]} className="text-sm">
                  {lead.estado}
                </Badge>
              </div>
              <div className="grid gap-1.5">
                {lead.estado !== 'CONTACTADO' && (
                  <Button
                    size="sm"
                    className="justify-center bg-sky-600 hover:bg-sky-700"
                    onClick={() => updateEstado('CONTACTADO')}
                  >
                    Marcar como Contactado
                  </Button>
                )}
                {lead.estado !== 'CALIFICADO' && (
                  <Button
                    size="sm"
                    className="justify-center bg-amber-500 hover:bg-amber-600"
                    onClick={() => updateEstado('CALIFICADO')}
                  >
                    Marcar como Calificado
                  </Button>
                )}
                {lead.estado !== 'CONVERTIDO' && (
                  <Button
                    variant="success"
                    size="sm"
                    className="justify-center"
                    onClick={() => updateEstado('CONVERTIDO')}
                  >
                    Convertir a Cliente
                  </Button>
                )}
                {lead.estado !== 'PERDIDO' && (
                  <Button
                    variant="outlineDanger"
                    size="sm"
                    className="justify-center"
                    onClick={() => updateEstado('PERDIDO')}
                  >
                    Marcar como Perdido
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

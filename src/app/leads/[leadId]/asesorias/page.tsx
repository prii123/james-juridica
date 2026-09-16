'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  User,
  Eye,
  Edit,
} from 'lucide-react'
import { EstadoAsesoria, TipoAsesoria, ModalidadAsesoria } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Spinner, type BadgeProps } from '@/components/ui'

interface Asesoria {
  id: string
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: Date
  duracion?: number | null
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string | null
  notas?: string | null
  valor?: number | null
  asesor: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  lead: {
    id: string
    nombre: string
  }
}

const ESTADO_BADGE_VARIANT: Record<EstadoAsesoria, BadgeProps['variant']> = {
  PENDIENTE: 'secondary',
  PROGRAMADA: 'warning',
  REALIZADA: 'success',
  CANCELADA: 'danger',
  REPROGRAMADA: 'info',
}

export default function LeadAsesoriasPage() {
  const params = useParams()
  const leadId = params.leadId as string

  const [asesorias, setAsesorias] = useState<Asesoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leadName, setLeadName] = useState<string>('')

  useEffect(() => {
    if (leadId) {
      fetchAsesorias()
    }
  }, [leadId])

  const fetchAsesorias = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leads/${leadId}/asesorias`)
      if (response.ok) {
        const data = await response.json()
        setAsesorias(data.asesorias)
        setLeadName(data.leadName)
      } else {
        setError('Error al cargar las asesorías')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const getTipoText = (tipo: TipoAsesoria) => {
    switch (tipo) {
      case 'INICIAL': return 'Inicial'
      case 'SEGUIMIENTO': return 'Seguimiento'
      case 'ESPECIALIZADA': return 'Especializada'
      default: return tipo
    }
  }

  const getModalidadText = (modalidad: ModalidadAsesoria) => {
    switch (modalidad) {
      case 'PRESENCIAL': return 'Presencial'
      case 'VIRTUAL': return 'Virtual'
      case 'TELEFONICA': return 'Telefónica'
      default: return modalidad
    }
  }

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">{error}</Alert>
        <Link href={`/leads/${leadId}`}>
          <Button>Volver al Lead</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Leads', href: '/leads' },
          { label: leadName, href: `/leads/${leadId}` },
          { label: 'Asesorías' }
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
            <h1 className="mb-1 text-2xl font-bold text-slate-800">Asesorías</h1>
            <p className="mb-0 text-slate-500">
              Asesorías para {leadName}
            </p>
          </div>
        </div>
        <Link href={`/leads/${leadId}/asesorias/nueva`}>
          <Button>
            <Plus size={16} />
            Nueva Asesoría
          </Button>
        </Link>
      </div>

      {asesorias.length === 0 ? (
        <Card>
          <CardBody className="py-5 text-center">
            <Calendar size={64} className="mx-auto mb-3 text-slate-300" />
            <h4 className="text-lg font-semibold text-slate-800">No hay asesorías registradas</h4>
            <p className="mb-4 text-slate-500">
              Este lead no tiene asesorías programadas o realizadas.
            </p>
            <Link href={`/leads/${leadId}/asesorias/nueva`}>
              <Button>Programar Primera Asesoría</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {asesorias.map((asesoria) => (
            <Card key={asesoria.id} className="flex h-full flex-col">
              <CardHeader className="items-start">
                <div>
                  <h6 className="mb-1 font-semibold text-slate-800">{asesoria.tema}</h6>
                  <small className="text-slate-500">
                    {getTipoText(asesoria.tipo)} - {getModalidadText(asesoria.modalidad)}
                  </small>
                </div>
                <Badge variant={ESTADO_BADGE_VARIANT[asesoria.estado]}>{asesoria.estado}</Badge>
              </CardHeader>
              <CardBody className="flex flex-1 flex-col">
                <div className="mb-2 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <small>
                    {new Date(asesoria.fecha).toLocaleDateString('es-CO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </small>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <small>
                    {new Date(asesoria.fecha).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {asesoria.duracion && ` (${asesoria.duracion} min)`}
                  </small>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <small>
                    {asesoria.asesor.nombre} {asesoria.asesor.apellido}
                  </small>
                </div>

                {asesoria.descripcion && (
                  <p className="mb-3 text-sm text-slate-500">
                    {asesoria.descripcion}
                  </p>
                )}

                {asesoria.valor && (
                  <div className="mb-3">
                    <strong className="text-teal-700">
                      ${asesoria.valor.toLocaleString('es-CO')}
                    </strong>
                  </div>
                )}

                <div className="mt-auto flex gap-2">
                  <Link href={`/asesorias/${asesoria.id}`} className="flex-1">
                    <Button variant="outlinePrimary" size="sm" className="w-full justify-center">
                      <Eye size={14} />
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/asesorias/${asesoria.id}/editar`}>
                    <Button variant="outline" size="icon">
                      <Edit size={14} />
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Resumen */}
      {asesorias.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold text-blue-800">
                  {asesorias.length}
                </div>
                <small className="text-slate-500">Total Asesorías</small>
              </div>
              <div>
                <div className="text-2xl font-bold text-teal-700">
                  {asesorias.filter(a => a.estado === 'REALIZADA').length}
                </div>
                <small className="text-slate-500">Realizadas</small>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-500">
                  {asesorias.filter(a => a.estado === 'PROGRAMADA').length}
                </div>
                <small className="text-slate-500">Programadas</small>
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-700">
                  ${asesorias.reduce((sum, a) => sum + (a.valor || 0), 0).toLocaleString('es-CO')}
                </div>
                <small className="text-slate-500">Valor Total</small>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  )
}

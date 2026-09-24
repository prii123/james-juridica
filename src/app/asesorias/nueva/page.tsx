'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User } from 'lucide-react'
import { TipoAsesoria, ModalidadAsesoria, EstadoAsesoria } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

interface CreateAsesoriaData {
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: string
  hora: string
  duracion: number
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string
  leadId: string
  asesorId: string
  notas?: string
}

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  estado: string
}

interface Asesor {
  id: string
  nombre: string
  apellido: string
}

// Componente interno que usa useSearchParams
function NuevaAsesoriaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadIdParam = searchParams.get('leadId')

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [leads, setLeads] = useState<Lead[]>([])
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const [formData, setFormData] = useState<CreateAsesoriaData>({
    tipo: 'INICIAL',
    estado: 'PROGRAMADA',
    fecha: '',
    hora: '',
    duracion: 60,
    modalidad: 'PRESENCIAL',
    tema: '',
    descripcion: '',
    leadId: leadIdParam || '',
    asesorId: '',
    notas: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (leadIdParam && leads.length > 0) {
      const lead = leads.find(l => l.id === leadIdParam)
      if (lead) {
        setSelectedLead(lead)
        setFormData(prev => ({
          ...prev,
          leadId: leadIdParam,
          tema: `Consulta inicial - ${lead.nombre}`
        }))
      }
    }
  }, [leadIdParam, leads])

  const fetchInitialData = async () => {
    try {
      setLoadingData(true)

      const [leadsResponse, asesoresResponse] = await Promise.all([
        fetch('/api/leads?limit=100'),
        fetch('/api/usuarios?role=ASESOR')
      ])

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        const leadsList = Array.isArray(leadsData) ? leadsData : leadsData.leads || []
        setLeads(leadsList)
      }

      if (asesoresResponse.ok) {
        const asesoresData = await asesoresResponse.json()
        const asesoresList = Array.isArray(asesoresData) ? asesoresData : asesoresData.usuarios || []
        setAsesores(asesoresList)
      }

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error)
      setErrors({ general: 'Error al cargar datos iniciales' })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const fechaHora = new Date(`${formData.fecha}T${formData.hora}:00`)

      const asesoriaData = {
        ...formData,
        fecha: fechaHora.toISOString(),
        duracion: formData.duracion
      }

      delete (asesoriaData as any).hora

      const response = await fetch('/api/asesorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asesoriaData),
      })

      if (response.ok) {
        const asesoria = await response.json()

        router.push(`/asesorias/${asesoria.id}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.error || 'Error al crear la asesoría' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateAsesoriaData, value: string | number | TipoAsesoria | ModalidadAsesoria | EstadoAsesoria | undefined) => {
    setFormData({ ...formData, [field]: value })

    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }

    if (field === 'leadId' && value && typeof value === 'string') {
      const lead = leads.find(l => l.id === value)
      if (lead) {
        setSelectedLead(lead)
        if (!formData.tema || formData.tema.startsWith('Consulta inicial -')) {
          setFormData(prev => ({
            ...prev,
            leadId: value,
            tema: `Consulta inicial - ${lead.nombre}`
          }))
        } else {
          setFormData(prev => ({ ...prev, leadId: value }))
        }
      }
    }
  }

  if (loadingData) {
    return <Spinner />
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Asesorías', href: '/asesorias' },
          { label: 'Nueva Asesoría' }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/asesorias">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Nueva Asesoría</h1>
          <p className="mb-0 text-slate-500">
            {leadIdParam ? `Crear asesoría para ${selectedLead?.nombre || 'lead seleccionado'}` : 'Crear nueva asesoría jurídica'}
          </p>
        </div>
      </div>

      {errors.general && (
        <Alert variant="danger" className="mb-4">{errors.general}</Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card>
              <CardHeader><CardTitle>Información de la Asesoría</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                {/* Lead Selection */}
                <div>
                  <Label className="font-semibold">Lead/Cliente *</Label>
                  {leadIdParam ? (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                      <User size={16} className="text-slate-500" />
                      <span>{selectedLead?.nombre || 'Lead seleccionado'}</span>
                      <small className="ml-auto text-slate-500">({selectedLead?.email})</small>
                    </div>
                  ) : (
                    <Select
                      className={cn(errors.leadId && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.leadId}
                      onChange={(e) => handleInputChange('leadId', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar lead/cliente</option>
                      {leads && leads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.nombre} - {lead.email}
                        </option>
                      ))}
                    </Select>
                  )}
                  {!leadIdParam && (
                    <p className="mt-1 text-xs text-slate-500">
                      <Link href="/leads/nuevo" className="text-blue-800 hover:underline">
                        ¿No encuentras el lead? Crear nuevo lead
                      </Link>
                    </p>
                  )}
                  {errors.leadId && <p className="mt-1 text-xs text-red-600">{errors.leadId}</p>}
                </div>

                {/* Tema */}
                <div>
                  <Label className="font-semibold">Tema de la Asesoría *</Label>
                  <Input
                    type="text"
                    className={cn(errors.tema && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                    value={formData.tema}
                    onChange={(e) => handleInputChange('tema', e.target.value)}
                    placeholder="Ej: Consulta sobre proceso de insolvencia"
                    required
                  />
                  {errors.tema && <p className="mt-1 text-xs text-red-600">{errors.tema}</p>}
                </div>

                {/* Descripción */}
                <div>
                  <Label className="font-semibold">Descripción</Label>
                  <Textarea
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción detallada de la asesoría..."
                  />
                  {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion}</p>}
                </div>

                {/* Fecha y Hora */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label className="font-semibold">Fecha *</Label>
                    <Input
                      type="date"
                      className={cn(errors.fecha && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.fecha}
                      onChange={(e) => handleInputChange('fecha', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    {errors.fecha && <p className="mt-1 text-xs text-red-600">{errors.fecha}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Hora *</Label>
                    <Input
                      type="time"
                      className={cn(errors.hora && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.hora}
                      onChange={(e) => handleInputChange('hora', e.target.value)}
                      required
                    />
                    {errors.hora && <p className="mt-1 text-xs text-red-600">{errors.hora}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Duración (minutos)</Label>
                    <Select
                      value={formData.duracion}
                      onChange={(e) => handleInputChange('duracion', parseInt(e.target.value))}
                    >
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>1 hora</option>
                      <option value={90}>1.5 horas</option>
                      <option value={120}>2 horas</option>
                    </Select>
                  </div>
                </div>

                {/* Tipo, Modalidad y Estado */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label className="font-semibold">Tipo de Asesoría *</Label>
                    <Select
                      className={cn(errors.tipo && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.tipo}
                      onChange={(e) => handleInputChange('tipo', e.target.value as TipoAsesoria)}
                      required
                    >
                      <option value="INICIAL">Inicial</option>
                      <option value="SEGUIMIENTO">Seguimiento</option>
                      <option value="ESPECIALIZADA">Especializada</option>
                    </Select>
                    {errors.tipo && <p className="mt-1 text-xs text-red-600">{errors.tipo}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Modalidad</Label>
                    <Select
                      value={formData.modalidad}
                      onChange={(e) => handleInputChange('modalidad', e.target.value as ModalidadAsesoria)}
                    >
                      <option value="PRESENCIAL">Presencial</option>
                      <option value="VIRTUAL">Virtual</option>
                      <option value="TELEFONICA">Telefónica</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold">Estado</Label>
                    <Select
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value as EstadoAsesoria)}
                    >
                      <option value="PROGRAMADA">Programada</option>
                      <option value="REALIZADA">Realizada</option>
                      <option value="CANCELADA">Cancelada</option>
                      <option value="REPROGRAMADA">Reprogramada</option>
                    </Select>
                  </div>
                </div>

                {/* Asesor */}
                <div>
                  <Label className="font-semibold">Asesor Asignado *</Label>
                  <Select
                    className={cn(errors.asesorId && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                    value={formData.asesorId}
                    onChange={(e) => handleInputChange('asesorId', e.target.value)}
                    required
                  >
                    <option value="">Seleccionar asesor</option>
                    {asesores && asesores.map((asesor) => (
                      <option key={asesor.id} value={asesor.id}>
                        {asesor.nombre} {asesor.apellido}
                      </option>
                    ))}
                  </Select>
                  {errors.asesorId && <p className="mt-1 text-xs text-red-600">{errors.asesorId}</p>}
                </div>

                {/* Notas */}
                <div>
                  <Label className="font-semibold">Notas Adicionales</Label>
                  <Textarea
                    rows={3}
                    value={formData.notas}
                    onChange={(e) => handleInputChange('notas', e.target.value)}
                    placeholder="Notas internas sobre la asesoría..."
                  />
                  {errors.notas && <p className="mt-1 text-xs text-red-600">{errors.notas}</p>}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <Card>
              <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
              <CardBody>
                <div className="grid gap-2">
                  <Button type="submit" loading={loading} className="justify-center">
                    {!loading && <Save size={16} />}
                    {loading ? 'Creando...' : 'Crear Asesoría'}
                  </Button>
                  <Link href="/asesorias">
                    <Button type="button" variant="outline" className="w-full justify-center">Cancelar</Button>
                  </Link>
                </div>

                <hr className="my-4 border-slate-200" />

                <div className="text-sm text-slate-500">
                  <h6 className="mb-2 font-semibold text-slate-700">Workflow:</h6>
                  <ul className="list-none space-y-1 p-0">
                    <li>• La asesoría se asociará al lead seleccionado</li>
                    <li>• Una vez REALIZADA podrá generar una radicación o caso</li>
                  </ul>
                </div>
              </CardBody>
            </Card>

            {selectedLead && (
              <Card>
                <CardHeader><CardTitle>Cliente/Lead</CardTitle></CardHeader>
                <CardBody>
                  <div className="mb-2 flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">{selectedLead.nombre}</span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-500">
                    <div>Email: {selectedLead.email}</div>
                    <div>Teléfono: {selectedLead.telefono}</div>
                    <div className="flex items-center gap-1">Estado: <Badge variant="primary">{selectedLead.estado}</Badge></div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </form>
    </>
  )
}

// Componente principal exportado que envuelve el contenido en Suspense
export default function NuevaAsesoriaPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <NuevaAsesoriaContent />
    </Suspense>
  )
}

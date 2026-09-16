'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User } from 'lucide-react'
import { TipoAsesoria, EstadoAsesoria, ModalidadAsesoria } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface CreateAsesoriaData {
  descripcion: string
  tema: string
  fecha: string
  hora: string
  duracion: number
  modalidad: ModalidadAsesoria
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  asesorId: string
  notas?: string
}

interface Asesor {
  id: string
  nombre: string
  apellido: string
}

export default function NuevaAsesoriaLeadPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.leadId as string

  const [loading, setLoading] = useState(false)
  const [loadingAsesores, setLoadingAsesores] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [leadName, setLeadName] = useState<string>('')
  const [formData, setFormData] = useState<CreateAsesoriaData>({
    descripcion: '',
    tema: '',
    fecha: '',
    hora: '',
    duracion: 60,
    modalidad: 'PRESENCIAL',
    tipo: 'INICIAL',
    estado: 'PROGRAMADA',
    asesorId: '',
    notas: ''
  })

  useEffect(() => {
    fetchAsesores()
    fetchLeadInfo()
  }, [])

  const fetchAsesores = async () => {
    try {
      console.log('Iniciando carga de asesores...')

      // Primero intentamos con el endpoint de usuarios
      let response = await fetch('/api/usuarios?role=Asesor')
      console.log('Respuesta usuarios:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('Datos usuarios recibidos:', data)
        if (data.usuarios && data.usuarios.length > 0) {
          setAsesores(data.usuarios)
          console.log('Asesores establecidos desde usuarios:', data.usuarios.length)
          return
        }
      }

      // Si no funciona, intentamos con el endpoint específico de asesores
      console.log('Intentando con endpoint de asesores...')
      response = await fetch('/api/asesores')
      console.log('Respuesta asesores:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('Datos asesores recibidos:', data)
        setAsesores(data.asesores || [])
        console.log('Asesores establecidos desde asesores:', data.asesores?.length || 0)
      } else {
        const errorData = await response.json()
        console.error('Error en ambas respuestas:', errorData)
        setAsesores([])
      }
    } catch (error) {
      console.error('Error al cargar asesores:', error)
      setAsesores([])
    } finally {
      setLoadingAsesores(false)
    }
  }

  const fetchLeadInfo = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}`)
      if (response.ok) {
        const lead = await response.json()
        setLeadName(lead.nombre)
        setFormData(prev => ({
          ...prev,
          descripcion: `Consulta con ${lead.nombre}`
        }))
      }
    } catch (error) {
      console.error('Error al cargar información del lead:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Combinar fecha y hora
      const fechaHora = new Date(`${formData.fecha}T${formData.hora}:00`)

      const asesoriaData = {
        ...formData,
        fecha: fechaHora.toISOString(),
        leadId
      }

      delete (asesoriaData as any).hora

      const response = await fetch(`/api/leads/${leadId}/asesorias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asesoriaData),
      })

      if (response.ok) {
        router.push(`/leads/${leadId}/asesorias`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.message || 'Error al crear la asesoría' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateAsesoriaData, value: string | number | TipoAsesoria | EstadoAsesoria | ModalidadAsesoria) => {
    setFormData({ ...formData, [field]: value })
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Leads', href: '/leads' },
          { label: leadName, href: `/leads/${leadId}` },
          { label: 'Asesorías', href: `/leads/${leadId}/asesorias` },
          { label: 'Nueva Asesoría' }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href={`/leads/${leadId}/asesorias`}>
          <Button variant="outline" size="icon">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Nueva Asesoría</h1>
          <p className="mb-0 text-slate-500">Crear asesoría para el lead: {leadName}</p>
        </div>
      </div>

      {errors.general && (
        <Alert variant="danger" className="mb-4">{errors.general}</Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Asesoría</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <Label className="font-semibold">Descripción *</Label>
                  <Textarea
                    className={cn(errors.descripcion && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                    rows={4}
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción detallada de la asesoría..."
                    required
                  />
                  {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion}</p>}
                </div>

                <div>
                  <Label className="font-semibold">Tema *</Label>
                  <Input
                    type="text"
                    className={cn(errors.tema && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                    value={formData.tema}
                    onChange={(e) => handleInputChange('tema', e.target.value)}
                    placeholder="Tema principal de la asesoría"
                    required
                  />
                  {errors.tema && <p className="mt-1 text-xs text-red-600">{errors.tema}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label className="font-semibold">Fecha *</Label>
                    <Input
                      type="date"
                      className={cn(errors.fecha && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.fecha}
                      onChange={(e) => handleInputChange('fecha', e.target.value)}
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
                      <option value={60}>1 hora</option>
                      <option value={90}>1.5 horas</option>
                      <option value={120}>2 horas</option>
                    </Select>
                  </div>
                </div>

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
                    <Label className="font-semibold">Modalidad *</Label>
                    <Select
                      className={cn(errors.modalidad && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.modalidad}
                      onChange={(e) => handleInputChange('modalidad', e.target.value as ModalidadAsesoria)}
                      required
                    >
                      <option value="PRESENCIAL">Presencial</option>
                      <option value="VIRTUAL">Virtual</option>
                      <option value="TELEFONICA">Telefónica</option>
                    </Select>
                    {errors.modalidad && <p className="mt-1 text-xs text-red-600">{errors.modalidad}</p>}
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

                <div>
                  <Label className="font-semibold">Asesor Asignado *</Label>
                  {loadingAsesores ? (
                    <div className="py-2 text-center">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-800 border-t-transparent" />
                    </div>
                  ) : (
                    <>
                      <Select
                        className={cn(errors.asesorId && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                        value={formData.asesorId}
                        onChange={(e) => handleInputChange('asesorId', e.target.value)}
                        required
                      >
                        <option value="">Seleccionar asesor</option>
                        {Array.isArray(asesores) && asesores.map((asesor) => (
                          <option key={asesor.id} value={asesor.id}>
                            {asesor.nombre} {asesor.apellido}
                          </option>
                        ))}
                      </Select>
                      {Array.isArray(asesores) && asesores.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          No se encontraron asesores disponibles. Asegúrate de que haya usuarios creados con rol ASESOR.
                        </p>
                      )}
                    </>
                  )}
                  {errors.asesorId && <p className="mt-1 text-xs text-red-600">{errors.asesorId}</p>}
                </div>

                <div>
                  <Label className="font-semibold">Notas</Label>
                  <Textarea
                    className={cn(errors.notas && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                    rows={3}
                    value={formData.notas}
                    onChange={(e) => handleInputChange('notas', e.target.value)}
                    placeholder="Notas adicionales..."
                  />
                  {errors.notas && <p className="mt-1 text-xs text-red-600">{errors.notas}</p>}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid gap-2">
                  <Button type="submit" loading={loading} disabled={loadingAsesores} className="justify-center">
                    {!loading && <Save size={16} />}
                    {loading ? 'Creando...' : 'Crear Asesoría'}
                  </Button>
                  <Link href={`/leads/${leadId}/asesorias`}>
                    <Button type="button" variant="outline" className="w-full justify-center">
                      Cancelar
                    </Button>
                  </Link>
                </div>

                <hr className="my-4 border-slate-200" />

                <div className="text-sm text-slate-500">
                  <h6 className="mb-2 font-semibold text-slate-700">Información:</h6>
                  <ul className="list-none space-y-1 p-0">
                    <li>• Los campos marcados con * son obligatorios</li>
                    <li>• La asesoría será asignada automáticamente al lead seleccionado</li>
                    <li>• Se notificará al asesor asignado por email</li>
                  </ul>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Asociado</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex items-center gap-2 text-slate-500">
                  <User size={16} />
                  <span>{leadName}</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}

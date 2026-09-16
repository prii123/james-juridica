'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User } from 'lucide-react'
import { TipoAsesoria, ModalidadAsesoria, EstadoAsesoria } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface EditAsesoriaData {
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: string
  hora: string
  duracion: number
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string
  asesorId: string
  notas?: string
}

interface Asesoria {
  id: string
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: string
  duracion: number
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string
  notas?: string
  lead: {
    id: string
    nombre: string
    email: string
  }
  asesor: {
    id: string
    nombre: string
    apellido: string
  }
}

interface Asesor {
  id: string
  nombre: string
  apellido: string
}

export default function EditAsesoriaPage({ params }: { params: { asesoriaId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [asesoria, setAsesoria] = useState<Asesoria | null>(null)

  const [formData, setFormData] = useState<EditAsesoriaData>({
    tipo: 'INICIAL',
    estado: 'PROGRAMADA',
    fecha: '',
    hora: '',
    duracion: 60,
    modalidad: 'PRESENCIAL',
    tema: '',
    descripcion: '',
    asesorId: '',
    notas: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoadingData(true)

      const [asesoriaResponse, asesoresResponse] = await Promise.all([
        fetch(`/api/asesorias/${params.asesoriaId}`),
        fetch('/api/usuarios?role=Asesor')
      ])

      if (asesoriaResponse.ok) {
        const asesoriaData = await asesoriaResponse.json()
        setAsesoria(asesoriaData)

        const fechaObj = new Date(asesoriaData.fecha)
        const fecha = fechaObj.toISOString().split('T')[0]
        const hora = fechaObj.toTimeString().substring(0, 5)

        setFormData({
          tipo: asesoriaData.tipo,
          estado: asesoriaData.estado,
          fecha,
          hora,
          duracion: asesoriaData.duracion,
          modalidad: asesoriaData.modalidad,
          tema: asesoriaData.tema,
          descripcion: asesoriaData.descripcion || '',
          asesorId: asesoriaData.asesor.id,
          notas: asesoriaData.notas || ''
        })
      }

      if (asesoresResponse.ok) {
        const response = await asesoresResponse.json()
        setAsesores(Array.isArray(response) ? response : response.usuarios || [])
      } else {
        console.error('Error al cargar asesores:', asesoresResponse.status)
        setAsesores([])
      }

    } catch (error) {
      console.error('Error al cargar datos:', error)
      setErrors({ general: 'Error al cargar datos' })
      setAsesores([])
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

      const updateData = {
        ...formData,
        fecha: fechaHora.toISOString(),
        duracion: formData.duracion
      }

      delete (updateData as any).hora

      const response = await fetch(`/api/asesorias/${params.asesoriaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        router.push(`/asesorias/${params.asesoriaId}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.error || 'Error al actualizar la asesoría' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof EditAsesoriaData, value: string | number | TipoAsesoria | ModalidadAsesoria | EstadoAsesoria | undefined) => {
    setFormData({ ...formData, [field]: value })

    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  if (loadingData) {
    return <Spinner />
  }

  if (!asesoria) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">Asesoría no encontrada</Alert>
        <Link href="/asesorias"><Button>Volver a Asesorías</Button></Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Asesorías', href: '/asesorias' },
          { label: asesoria.tema, href: `/asesorias/${params.asesoriaId}` },
          { label: 'Editar' }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href={`/asesorias/${params.asesoriaId}`}>
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Editar Asesoría</h1>
          <p className="mb-0 text-slate-500">Cliente: {asesoria.lead.nombre}</p>
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
                {/* Cliente (Solo lectura) */}
                <div>
                  <Label className="font-semibold">Cliente</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                    <User size={16} className="text-slate-500" />
                    <span>{asesoria.lead.nombre}</span>
                    <small className="ml-auto text-slate-500">({asesoria.lead.email})</small>
                  </div>
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
                    {Array.isArray(asesores) && asesores.map((asesor) => (
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

          <div className="lg:col-span-4">
            <Card>
              <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
              <CardBody className="grid gap-2">
                <Button type="submit" loading={loading} className="justify-center">
                  {!loading && <Save size={16} />}
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Link href={`/asesorias/${params.asesoriaId}`}>
                  <Button type="button" variant="outline" className="w-full justify-center">Cancelar</Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}

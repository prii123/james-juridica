'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User, FileText, AlertCircle } from 'lucide-react'
import { EstadoRadicacion } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner } from '@/components/ui'

interface CreateRadicacionData {
  numero: string
  demandante: string
  demandado: string
  valor: number
  fechaSolicitud: string
  fechaAudiencia?: string
  asesoriaId?: string
  estado: EstadoRadicacion
  observaciones?: string
}

interface Asesoria {
  id: string
  tema: string
  lead: {
    id: string
    nombre: string
  }
}

// Loading component para Suspense
function LoadingNewRadicacion() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Radicaciones', href: '/radicaciones' },
          { label: 'Nueva Conciliación' }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/radicaciones">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Nueva Conciliación</h1>
          <p className="mb-0 text-slate-500">Cargando...</p>
        </div>
      </div>

      <Spinner />
    </>
  )
}

// Componente que usa useSearchParams
function NuevaRadicacionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const asesoriaId = searchParams.get('asesoriaId')

  const [loading, setLoading] = useState(false)
  const [loadingAsesoria, setLoadingAsesoria] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [asesoria, setAsesoria] = useState<Asesoria | null>(null)
  const [formData, setFormData] = useState<CreateRadicacionData>({
    numero: '',
    demandante: '',
    demandado: '',
    valor: 0,
    fechaSolicitud: new Date().toISOString().split('T')[0],
    fechaAudiencia: '',
    asesoriaId: asesoriaId || '',
    estado: 'SOLICITADA',
    observaciones: ''
  })

  useEffect(() => {
    if (asesoriaId) {
      fetchAsesoria()
    }

    generateRadicacionNumber()
  }, [asesoriaId])

  const fetchAsesoria = async () => {
    if (!asesoriaId) return

    try {
      setLoadingAsesoria(true)
      const response = await fetch(`/api/asesorias/${asesoriaId}`)

      if (response.ok) {
        const data = await response.json()
        setAsesoria(data)
        setFormData(prev => ({
          ...prev,
          demandante: data.lead.nombre,
          asesoriaId: data.id
        }))
      }
    } catch (error) {
      console.error('Error al cargar asesoría:', error)
    } finally {
      setLoadingAsesoria(false)
    }
  }

  const generateRadicacionNumber = () => {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    const numero = `CONC-${year}-${randomNum}`

    setFormData(prev => ({
      ...prev,
      numero
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const radicacionData = {
        ...formData,
        valor: parseFloat(formData.valor.toString()),
        fechaSolicitud: new Date(formData.fechaSolicitud).toISOString(),
        fechaAudiencia: formData.fechaAudiencia
          ? new Date(formData.fechaAudiencia).toISOString()
          : undefined
      }

      const response = await fetch('/api/radicaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(radicacionData),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/radicaciones/${data.id}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.message || 'Error al crear la conciliación' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateRadicacionData, value: string | number) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Radicaciones', href: '/radicaciones' },
          { label: 'Nueva Conciliación' }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/radicaciones">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Nueva Conciliación</h1>
          <p className="mb-0 text-slate-500">
            {asesoria ? `Originada desde: ${asesoria.tema}` : 'Crear nueva conciliación'}
          </p>
        </div>
      </div>

      {errors.general && (
        <Alert variant="danger" className="mb-4">
          <span className="flex items-center gap-2"><AlertCircle size={16} />{errors.general}</span>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card>
              <CardHeader><CardTitle>Información de la Conciliación</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Número de Conciliación *</Label>
                    <Input
                      type="text"
                      value={formData.numero}
                      onChange={(e) => handleInputChange('numero', e.target.value)}
                      placeholder="CONC-2026-0001"
                      required
                    />
                    {errors.numero && <p className="mt-1 text-xs text-red-600">{errors.numero}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Estado</Label>
                    <Select
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value as EstadoRadicacion)}
                    >
                      <option value="SOLICITADA">Solicitada</option>
                      <option value="PROGRAMADA">Programada</option>
                      <option value="REALIZADA">Realizada</option>
                      <option value="CANCELADA">Cancelada</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Demandante *</Label>
                    <Input
                      type="text"
                      value={formData.demandante}
                      onChange={(e) => handleInputChange('demandante', e.target.value)}
                      placeholder="Nombre del demandante"
                      required
                    />
                    {errors.demandante && <p className="mt-1 text-xs text-red-600">{errors.demandante}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Demandado *</Label>
                    <Input
                      type="text"
                      value={formData.demandado}
                      onChange={(e) => handleInputChange('demandado', e.target.value)}
                      placeholder="Nombre del demandado"
                      required
                    />
                    {errors.demandado && <p className="mt-1 text-xs text-red-600">{errors.demandado}</p>}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Valor de la Conciliación *</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
                    <Input
                      type="number"
                      className="pl-7"
                      value={formData.valor}
                      onChange={(e) => handleInputChange('valor', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  {errors.valor && <p className="mt-1 text-xs text-red-600">{errors.valor}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Fecha de Solicitud *</Label>
                    <Input
                      type="date"
                      value={formData.fechaSolicitud}
                      onChange={(e) => handleInputChange('fechaSolicitud', e.target.value)}
                      required
                    />
                    {errors.fechaSolicitud && <p className="mt-1 text-xs text-red-600">{errors.fechaSolicitud}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Fecha de Audiencia</Label>
                    <Input
                      type="date"
                      value={formData.fechaAudiencia}
                      onChange={(e) => handleInputChange('fechaAudiencia', e.target.value)}
                    />
                    {errors.fechaAudiencia && <p className="mt-1 text-xs text-red-600">{errors.fechaAudiencia}</p>}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Observaciones</Label>
                  <Textarea
                    rows={4}
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Observaciones adicionales sobre la conciliación..."
                  />
                  {errors.observaciones && <p className="mt-1 text-xs text-red-600">{errors.observaciones}</p>}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-4">
            {/* Acciones */}
            <Card>
              <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
              <CardBody>
                <div className="grid gap-2">
                  <Button type="submit" loading={loading} disabled={loadingAsesoria} className="justify-center">
                    {!loading && <Save size={16} />}
                    {loading ? 'Creando...' : 'Crear Conciliación'}
                  </Button>
                  <Link href="/radicaciones">
                    <Button type="button" variant="outline" className="w-full justify-center">Cancelar</Button>
                  </Link>
                </div>

                <hr className="my-4 border-slate-200" />

                <div className="text-sm text-slate-500">
                  <h6 className="mb-2 font-semibold text-slate-700">Información:</h6>
                  <ul className="list-none space-y-1 p-0">
                    <li>• Los campos marcados con * son obligatorios</li>
                    <li>• El número se genera automáticamente</li>
                    <li>• La fecha de audiencia es opcional</li>
                  </ul>
                </div>
              </CardBody>
            </Card>

            {/* Información de la Asesoría Original */}
            {asesoria && (
              <Card>
                <CardHeader><CardTitle>Asesoría Origen</CardTitle></CardHeader>
                <CardBody>
                  <div className="mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">{asesoria.tema}</span>
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    <span className="text-slate-500">{asesoria.lead.nombre}</span>
                  </div>
                  <Link href={`/asesorias/${asesoria.id}`}>
                    <Button variant="outlinePrimary" size="sm" className="w-full justify-center">
                      Ver Asesoría
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </form>
    </>
  )
}

// Componente principal que envuelve el contenido en Suspense
export default function NuevaRadicacionPage() {
  return (
    <Suspense fallback={<LoadingNewRadicacion />}>
      <NuevaRadicacionContent />
    </Suspense>
  )
}

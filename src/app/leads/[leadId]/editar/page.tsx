'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User, Building2 } from 'lucide-react'
import { TipoPersona, EstadoLead } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface UpdateLeadData {
  nombre: string
  email: string
  telefono: string
  empresa?: string
  tipoPersona: TipoPersona
  documento?: string
  estado: EstadoLead
  origen?: string
  observaciones?: string
}

export default function EditarLeadPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.leadId as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<UpdateLeadData>({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    tipoPersona: 'NATURAL',
    documento: '',
    estado: 'NUEVO',
    origen: '',
    observaciones: ''
  })

  useEffect(() => {
    if (leadId) {
      fetchLead()
    }
  }, [leadId])

  const fetchLead = async () => {
    try {
      setLoadingData(true)
      const response = await fetch(`/api/leads/${leadId}`)
      if (response.ok) {
        const lead = await response.json()
        setFormData({
          nombre: lead.nombre || '',
          email: lead.email || '',
          telefono: lead.telefono || '',
          empresa: lead.empresa || '',
          tipoPersona: lead.tipoPersona || 'NATURAL',
          documento: lead.documento || '',
          estado: lead.estado || 'NUEVO',
          origen: lead.origen || '',
          observaciones: lead.observaciones || ''
        })
      } else {
        setErrors({ general: 'Error al cargar el lead' })
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión' })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push(`/leads/${leadId}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.message || 'Error al actualizar el lead' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UpdateLeadData, value: string | TipoPersona | EstadoLead) => {
    setFormData({ ...formData, [field]: value })
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  if (loadingData) {
    return <Spinner />
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Leads', href: '/leads' },
          { label: formData.nombre, href: `/leads/${leadId}` },
          { label: 'Editar' }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href={`/leads/${leadId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Editar Lead</h1>
          <p className="mb-0 text-slate-500">Actualizar información del prospecto</p>
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
                <CardTitle>Información del Lead</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Tipo de Persona */}
                <div>
                  <Label className="font-semibold">Tipo de Persona *</Label>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <label htmlFor="natural" className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        className="h-4 w-4 accent-blue-800"
                        type="radio"
                        name="tipoPersona"
                        id="natural"
                        checked={formData.tipoPersona === 'NATURAL'}
                        onChange={() => handleInputChange('tipoPersona', 'NATURAL')}
                      />
                      <User size={16} />
                      Persona Natural
                    </label>
                    <label htmlFor="juridica" className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        className="h-4 w-4 accent-blue-800"
                        type="radio"
                        name="tipoPersona"
                        id="juridica"
                        checked={formData.tipoPersona === 'JURIDICA'}
                        onChange={() => handleInputChange('tipoPersona', 'JURIDICA')}
                      />
                      <Building2 size={16} />
                      Persona Jurídica
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Nombre Completo *</Label>
                    <Input
                      type="text"
                      className={cn(errors.nombre && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      placeholder="Ingrese el nombre completo"
                      required
                    />
                    {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Documento de Identidad</Label>
                    <Input
                      type="text"
                      className={cn(errors.documento && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.documento}
                      onChange={(e) => handleInputChange('documento', e.target.value)}
                      placeholder={formData.tipoPersona === 'NATURAL' ? 'Cédula de ciudadanía' : 'NIT'}
                    />
                    {errors.documento && <p className="mt-1 text-xs text-red-600">{errors.documento}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Email *</Label>
                    <Input
                      type="email"
                      className={cn(errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <Label className="font-semibold">Teléfono *</Label>
                    <Input
                      type="tel"
                      className={cn(errors.telefono && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      placeholder="3001234567"
                      required
                    />
                    {errors.telefono && <p className="mt-1 text-xs text-red-600">{errors.telefono}</p>}
                  </div>
                </div>

                {formData.tipoPersona === 'JURIDICA' && (
                  <div>
                    <Label className="font-semibold">Nombre de la Empresa</Label>
                    <Input
                      type="text"
                      className={cn(errors.empresa && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                      value={formData.empresa}
                      onChange={(e) => handleInputChange('empresa', e.target.value)}
                      placeholder="Nombre de la empresa"
                    />
                    {errors.empresa && <p className="mt-1 text-xs text-red-600">{errors.empresa}</p>}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Estado</Label>
                    <Select
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value as EstadoLead)}
                    >
                      <option value="NUEVO">Nuevo</option>
                      <option value="CONTACTADO">Contactado</option>
                      <option value="CALIFICADO">Calificado</option>
                      <option value="PERDIDO">Perdido</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold">Origen del Lead</Label>
                    <Select
                      value={formData.origen}
                      onChange={(e) => handleInputChange('origen', e.target.value)}
                    >
                      <option value="">Seleccionar origen</option>
                      <option value="WEB">Página Web</option>
                      <option value="REFERIDO">Referido</option>
                      <option value="MARKETING">Campaña de Marketing</option>
                      <option value="REDES_SOCIALES">Redes Sociales</option>
                      <option value="EVENTO">Evento</option>
                      <option value="LLAMADA_FRIA">Llamada en Frío</option>
                      <option value="OTRO">Otro</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Observaciones</Label>
                  <Textarea
                    className={cn(errors.observaciones && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                    rows={4}
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Información adicional sobre el lead..."
                  />
                  {errors.observaciones && <p className="mt-1 text-xs text-red-600">{errors.observaciones}</p>}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid gap-2">
                  <Button type="submit" loading={loading} className="justify-center">
                    {!loading && <Save size={16} />}
                    {loading ? 'Guardando...' : 'Actualizar Lead'}
                  </Button>
                  <Link href={`/leads/${leadId}`}>
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
                    <li>• El email debe ser único en el sistema</li>
                    <li>• El documento debe ser válido para Colombia</li>
                  </ul>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}

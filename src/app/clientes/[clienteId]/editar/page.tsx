'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { TipoPersona } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Label, Alert, Spinner } from '@/components/ui'

interface FormData {
  nombre: string
  apellido: string
  email: string
  telefono: string
  documento: string
  tipoPersona: TipoPersona
  empresa: string
  direccion: string
  ciudad: string
  activo: boolean
}

const VACIO: FormData = {
  nombre: '', apellido: '', email: '', telefono: '', documento: '',
  tipoPersona: 'NATURAL', empresa: '', direccion: '', ciudad: '', activo: true,
}

export default function EditarClientePage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = params.clienteId as string

  const [loadingData, setLoadingData] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<FormData>(VACIO)

  useEffect(() => {
    if (!clienteId) return
    fetch(`/api/clientes/${clienteId}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar el cliente')
        setFormData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          email: data.email || '',
          telefono: data.telefono || '',
          documento: data.documento || '',
          tipoPersona: data.tipoPersona || 'NATURAL',
          empresa: data.empresa || '',
          direccion: data.direccion || '',
          ciudad: data.ciudad || '',
          activo: data.activo,
        })
      })
      .catch((e) => setErrors({ general: e.message }))
      .finally(() => setLoadingData(false))
  }, [clienteId])

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          apellido: formData.apellido || null,
          empresa: formData.empresa || null,
          direccion: formData.direccion || null,
          ciudad: formData.ciudad || null,
        }),
      })
      if (res.ok) {
        router.push(`/clientes/${clienteId}`)
      } else {
        const data = await res.json()
        setErrors({ general: data.error || 'No se pudo actualizar el cliente' })
      }
    } catch {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) return <Spinner />

  return (
    <>
      <Breadcrumb items={[{ label: 'Clientes', href: '/clientes' }, { label: 'Editar' }]} />

      <div className="mb-4 flex items-center gap-3">
        <Link href={`/clientes/${clienteId}`}>
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Editar Cliente</h1>
          <p className="mb-0 text-slate-500">{formData.nombre} {formData.apellido}</p>
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
              <CardHeader><CardTitle>Información del Cliente</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Nombre *</Label>
                    <Input value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} required />
                  </div>
                  <div>
                    <Label className="font-semibold">Apellido</Label>
                    <Input value={formData.apellido} onChange={(e) => handleChange('apellido', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Email *</Label>
                    <Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
                  </div>
                  <div>
                    <Label className="font-semibold">Teléfono *</Label>
                    <Input value={formData.telefono} onChange={(e) => handleChange('telefono', e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Documento *</Label>
                    <Input value={formData.documento} onChange={(e) => handleChange('documento', e.target.value)} required />
                  </div>
                  <div>
                    <Label className="font-semibold">Tipo de Persona</Label>
                    <Select value={formData.tipoPersona} onChange={(e) => handleChange('tipoPersona', e.target.value as TipoPersona)}>
                      <option value="NATURAL">Persona Natural</option>
                      <option value="JURIDICA">Persona Jurídica</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Empresa</Label>
                  <Input value={formData.empresa} onChange={(e) => handleChange('empresa', e.target.value)} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-semibold">Dirección</Label>
                    <Input value={formData.direccion} onChange={(e) => handleChange('direccion', e.target.value)} />
                  </div>
                  <div>
                    <Label className="font-semibold">Ciudad</Label>
                    <Input value={formData.ciudad} onChange={(e) => handleChange('ciudad', e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Estado</Label>
                  <Select value={formData.activo ? 'true' : 'false'} onChange={(e) => handleChange('activo', e.target.value === 'true')}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </Select>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="sticky top-20">
              <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
              <CardBody className="grid gap-2">
                <Button type="submit" loading={loading} className="justify-center">
                  {!loading && <Save size={16} />}
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Link href={`/clientes/${clienteId}`}>
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

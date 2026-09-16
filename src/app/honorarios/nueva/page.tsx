'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Search, X } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert } from '@/components/ui'

interface CasoResult {
  id: string
  numeroCaso: string
  cliente: { nombre: string; apellido?: string }
}

export default function NuevoHonorarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [casos, setCasos] = useState<CasoResult[]>([])
  const [selectedCaso, setSelectedCaso] = useState<CasoResult | null>(null)
  const [formData, setFormData] = useState({
    tipo: 'ASESORIA',
    valor: '',
    modalidadPago: 'CONTADO',
    fechaVencimiento: '',
    observaciones: '',
    numeroCuotas: 6,
    valorCuota: '',
  })

  const searchCasos = async () => {
    if (!searchTerm.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/casos?search=${encodeURIComponent(searchTerm)}`)
      if (res.ok) {
        const data = await res.json()
        setCasos(data.casos || [])
      }
    } catch {
      setCasos([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.valor || Number(formData.valor) <= 0) {
      setError('El valor del honorario debe ser mayor a 0')
      return
    }
    try {
      setSaving(true)
      setError('')
      const body: Record<string, any> = {
        tipo: formData.tipo,
        modalidadPago: formData.modalidadPago,
        valor: Number(formData.valor),
        fechaVencimiento: formData.fechaVencimiento || undefined,
        observaciones: formData.observaciones || undefined,
      }
      if (selectedCaso) body.casoId = selectedCaso.id
      if (formData.modalidadPago === 'FINANCIADO') {
        body.numeroCuotas = formData.numeroCuotas
        if (formData.valorCuota) body.valorCuota = Number(formData.valorCuota)
      }
      const res = await fetch('/api/honorarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Error al crear honorario')
      }
      const result = await res.json()
      router.push(`/facturacion/nueva?honorarioId=${result.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Honorarios', href: '/honorarios' }, { label: 'Nuevo Honorario' }]} />
      <div className="mb-4 flex items-center gap-3">
        <Link href="/honorarios">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <h1 className="mb-0 text-xl font-bold text-slate-800">Nuevo Honorario</h1>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Card>
              <CardHeader><CardTitle>Caso Asociado (opcional)</CardTitle></CardHeader>
              <CardBody>
                <div className="mb-3 flex gap-2">
                  <Input
                    type="text"
                    placeholder="Buscar caso por número o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchCasos())}
                  />
                  <Button type="button" variant="outlinePrimary" onClick={searchCasos} disabled={loading}>
                    <Search size={16} />
                  </Button>
                </div>
                {selectedCaso && (
                  <Alert variant="info" className="mb-3 items-center justify-between py-2">
                    <span>
                      Caso seleccionado: <strong>{selectedCaso.numeroCaso}</strong> — {selectedCaso.cliente.nombre} {selectedCaso.cliente.apellido}
                    </span>
                    <button type="button" onClick={() => setSelectedCaso(null)}><X size={16} /></button>
                  </Alert>
                )}
                {casos.length > 0 && !selectedCaso && (
                  <div className="mb-3 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200" style={{ maxHeight: 150 }}>
                    {casos.map(c => (
                      <button
                        type="button"
                        key={c.id}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={() => { setSelectedCaso(c); setCasos([]); setSearchTerm('') }}
                      >
                        <strong>{c.numeroCaso}</strong> — {c.cliente.nombre} {c.cliente.apellido}
                      </button>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Detalles del Honorario</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      required
                    >
                      <option value="ASESORIA">Asesoría</option>
                      <option value="REPRESENTACION">Representación</option>
                      <option value="TRAMITE">Trámite</option>
                      <option value="GESTION_COBRANZA">Gestión de Cobranza</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor *</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Modalidad de Pago</Label>
                    <Select
                      value={formData.modalidadPago}
                      onChange={(e) => setFormData({ ...formData, modalidadPago: e.target.value })}
                    >
                      <option value="CONTADO">Contado</option>
                      <option value="FINANCIADO">Financiado</option>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Fecha de Vencimiento</Label>
                    <Input
                      type="date"
                      value={formData.fechaVencimiento}
                      onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                    />
                  </div>
                  {formData.modalidadPago === 'FINANCIADO' && (
                    <div>
                      <Label>Número de Cuotas</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.numeroCuotas}
                        onChange={(e) => setFormData({ ...formData, numeroCuotas: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Observaciones</Label>
                  <Textarea
                    rows={3}
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card>
              <CardBody>
                <Button type="submit" variant="success" loading={saving} className="w-full justify-center">
                  {!saving && <Save size={16} />}
                  {saving ? 'Creando...' : 'Crear Honorario'}
                </Button>
                <Link href="/honorarios">
                  <Button type="button" variant="outline" className="mt-2 w-full justify-center">Cancelar</Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}

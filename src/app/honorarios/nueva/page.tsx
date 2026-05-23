'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Search } from 'lucide-react'

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

  const formatCurrency = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)

  return (
    <>
      <Breadcrumb items={[{ label: 'Honorarios', href: '/honorarios' }, { label: 'Nuevo Honorario' }]} />
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/honorarios" className="btn btn-outline-secondary"><ArrowLeft size={16} /></Link>
        <h1 className="h3 fw-bold text-dark mb-0">Nuevo Honorario</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header"><h5 className="mb-0">Caso Asociado (opcional)</h5></div>
              <div className="card-body">
                <div className="input-group mb-3">
                  <input type="text" className="form-control" placeholder="Buscar caso por número o cliente..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchCasos())} />
                  <button type="button" className="btn btn-outline-primary" onClick={searchCasos} disabled={loading}>
                    <Search size={16} />
                  </button>
                </div>
                {selectedCaso && (
                  <div className="alert alert-info py-2">
                    Caso seleccionado: <strong>{selectedCaso.numeroCaso}</strong> — {selectedCaso.cliente.nombre} {selectedCaso.cliente.apellido}
                    <button type="button" className="btn-close ms-2" onClick={() => setSelectedCaso(null)} />
                  </div>
                )}
                {casos.length > 0 && !selectedCaso && (
                  <div className="list-group mb-3" style={{ maxHeight: 150, overflowY: 'auto' }}>
                    {casos.map(c => (
                      <button type="button" key={c.id} className="list-group-item list-group-item-action"
                        onClick={() => { setSelectedCaso(c); setCasos([]); setSearchTerm('') }}>
                        <strong>{c.numeroCaso}</strong> — {c.cliente.nombre} {c.cliente.apellido}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header"><h5 className="mb-0">Detalles del Honorario</h5></div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Tipo *</label>
                    <select className="form-select" value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} required>
                      <option value="ASESORIA">Asesoría</option>
                      <option value="REPRESENTACION">Representación</option>
                      <option value="TRAMITE">Trámite</option>
                      <option value="GESTION_COBRANZA">Gestión de Cobranza</option>
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Valor *</label>
                    <input type="number" className="form-control" min={0} step={1000} value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })} required />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Modalidad de Pago</label>
                    <select className="form-select" value={formData.modalidadPago}
                      onChange={(e) => setFormData({ ...formData, modalidadPago: e.target.value })}>
                      <option value="CONTADO">Contado</option>
                      <option value="FINANCIADO">Financiado</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Fecha de Vencimiento</label>
                    <input type="date" className="form-control" value={formData.fechaVencimiento}
                      onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })} />
                  </div>
                  {formData.modalidadPago === 'FINANCIADO' && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Número de Cuotas</label>
                      <input type="number" className="form-control" min={1} value={formData.numeroCuotas}
                        onChange={(e) => setFormData({ ...formData, numeroCuotas: parseInt(e.target.value) || 1 })} />
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-control" rows={3} value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-body">
                <button type="submit" className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" /> Creando...</> : <><Save size={16} /> Crear Honorario</>}
                </button>
                <Link href="/honorarios" className="btn btn-outline-secondary w-100 mt-2">Cancelar</Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}

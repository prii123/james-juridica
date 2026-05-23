'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Search } from 'lucide-react'

interface LeadResult {
  id: string
  nombre: string
  email: string
  telefono: string
  documento?: string
}

export default function NuevoCasoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [leadSearch, setLeadSearch] = useState('')
  const [leads, setLeads] = useState<LeadResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadResult | null>(null)

  const [formData, setFormData] = useState({
    tipoInsolvencia: 'REORGANIZACION',
    prioridad: 'MEDIA',
    observaciones: '',
    clienteNombre: '',
    clienteEmail: '',
    clienteTelefono: '',
    clienteDocumento: '',
  })

  const searchLeads = async () => {
    if (!leadSearch.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/leads?search=${encodeURIComponent(leadSearch)}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      }
    } catch {
      setLeads([])
    } finally {
      setSearching(false)
    }
  }

  const selectLead = (lead: LeadResult) => {
    setSelectedLead(lead)
    setFormData(prev => ({
      ...prev,
      clienteNombre: lead.nombre,
      clienteEmail: lead.email,
      clienteTelefono: lead.telefono,
      clienteDocumento: lead.documento || '',
    }))
    setLeads([])
    setLeadSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clienteNombre) {
      setError('Debes seleccionar un lead o ingresar los datos del cliente')
      return
    }
    try {
      setSaving(true)
      setError('')

      // Crear o buscar cliente
      let clienteId = selectedLead?.id
      if (!clienteId) {
        const clienteRes = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formData.clienteNombre.split(' ')[0],
            apellido: formData.clienteNombre.split(' ').slice(1).join(' ') || '',
            email: formData.clienteEmail,
            telefono: formData.clienteTelefono,
            documento: formData.clienteDocumento,
          }),
        })
        if (!clienteRes.ok) {
          const errData = await clienteRes.json()
          throw new Error(errData.error || 'Error al crear cliente')
        }
        const newCliente = await clienteRes.json()
        clienteId = newCliente.id
      }

      const response = await fetch('/api/casos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoInsolvencia: formData.tipoInsolvencia,
          prioridad: formData.prioridad,
          observaciones: formData.observaciones,
          clienteId,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Error al crear el caso')
      }

      const result = await response.json()
      router.push(`/casos/${result.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Casos', href: '/casos' }, { label: 'Nuevo Caso' }]} />
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/casos" className="btn btn-outline-secondary"><ArrowLeft size={16} /></Link>
        <h1 className="h3 fw-bold text-dark mb-0">Nuevo Caso</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header"><h5 className="mb-0">Buscar Cliente</h5></div>
              <div className="card-body">
                <div className="input-group mb-3">
                  <input type="text" className="form-control" placeholder="Buscar lead por nombre, email o teléfono..."
                    value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLeads())} />
                  <button type="button" className="btn btn-outline-primary" onClick={searchLeads} disabled={searching}>
                    <Search size={16} />
                  </button>
                </div>
                {leads.length > 0 && (
                  <div className="list-group mb-3" style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {leads.map(lead => (
                      <button type="button" key={lead.id} className="list-group-item list-group-item-action"
                        onClick={() => selectLead(lead)}>
                        <strong>{lead.nombre}</strong> — {lead.email} — {lead.telefono}
                      </button>
                    ))}
                  </div>
                )}
                <hr />
                <h6>O ingresa los datos del cliente manualmente</h6>
                <div className="row mt-2">
                  <div className="col-md-6 mb-2">
                    <label className="form-label">Nombre Completo *</label>
                    <input type="text" className="form-control" value={formData.clienteNombre}
                      onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })} required />
                  </div>
                  <div className="col-md-3 mb-2">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={formData.clienteEmail}
                      onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })} />
                  </div>
                  <div className="col-md-3 mb-2">
                    <label className="form-label">Teléfono</label>
                    <input type="text" className="form-control" value={formData.clienteTelefono}
                      onChange={(e) => setFormData({ ...formData, clienteTelefono: e.target.value })} />
                  </div>
                  <div className="col-md-3 mb-2">
                    <label className="form-label">Documento</label>
                    <input type="text" className="form-control" value={formData.clienteDocumento}
                      onChange={(e) => setFormData({ ...formData, clienteDocumento: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header"><h5 className="mb-0">Configuración del Caso</h5></div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tipo de Insolvencia *</label>
                    <select className="form-select" value={formData.tipoInsolvencia}
                      onChange={(e) => setFormData({ ...formData, tipoInsolvencia: e.target.value })} required>
                      <option value="REORGANIZACION">Reorganización</option>
                      <option value="LIQUIDACION_JUDICIAL">Liquidación Judicial</option>
                      <option value="INSOLVENCIA_PERSONA_NATURAL">Insolvencia Persona Natural</option>
                      <option value="ACUERDO_REORGANIZACION">Acuerdo de Reorganización</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Prioridad</label>
                    <select className="form-select" value={formData.prioridad}
                      onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}>
                      <option value="BAJA">Baja</option>
                      <option value="MEDIA">Media</option>
                      <option value="ALTA">Alta</option>
                      <option value="CRITICA">Crítica</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-control" rows={3} value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas iniciales del caso..." />
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-body">
                <button type="submit" className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" /> Creando...</> : <><Save size={16} /> Crear Caso</>}
                </button>
                <Link href="/casos" className="btn btn-outline-secondary w-100 mt-2">Cancelar</Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}

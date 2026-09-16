'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Search } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert } from '@/components/ui'

interface LeadResult {
  id: string
  nombre: string
  email: string
  telefono: string
  documento?: string
}

export default function NuevoCasoPage() {
  const router = useRouter()
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
      <div className="mb-4 flex items-center gap-3">
        <Link href="/casos">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <h1 className="mb-0 text-xl font-bold text-slate-800">Nuevo Caso</h1>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Card>
              <CardHeader><CardTitle>Buscar Cliente</CardTitle></CardHeader>
              <CardBody>
                <div className="mb-3 flex gap-2">
                  <Input
                    type="text"
                    placeholder="Buscar lead por nombre, email o teléfono..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLeads())}
                  />
                  <Button type="button" variant="outlinePrimary" onClick={searchLeads} disabled={searching}>
                    <Search size={16} />
                  </Button>
                </div>
                {leads.length > 0 && (
                  <div className="mb-3 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200" style={{ maxHeight: 200 }}>
                    {leads.map(lead => (
                      <button
                        type="button"
                        key={lead.id}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={() => selectLead(lead)}
                      >
                        <strong>{lead.nombre}</strong> — {lead.email} — {lead.telefono}
                      </button>
                    ))}
                  </div>
                )}
                <hr className="my-3 border-slate-200" />
                <h6 className="mb-2 font-semibold text-slate-700">O ingresa los datos del cliente manualmente</h6>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Nombre Completo *</Label>
                    <Input
                      type="text"
                      value={formData.clienteNombre}
                      onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.clienteEmail}
                      onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      type="text"
                      value={formData.clienteTelefono}
                      onChange={(e) => setFormData({ ...formData, clienteTelefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Documento</Label>
                    <Input
                      type="text"
                      value={formData.clienteDocumento}
                      onChange={(e) => setFormData({ ...formData, clienteDocumento: e.target.value })}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Configuración del Caso</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Tipo de Insolvencia *</Label>
                    <Select
                      value={formData.tipoInsolvencia}
                      onChange={(e) => setFormData({ ...formData, tipoInsolvencia: e.target.value })}
                      required
                    >
                      <option value="REORGANIZACION">Reorganización</option>
                      <option value="LIQUIDACION_JUDICIAL">Liquidación Judicial</option>
                      <option value="INSOLVENCIA_PERSONA_NATURAL">Insolvencia Persona Natural</option>
                      <option value="ACUERDO_REORGANIZACION">Acuerdo de Reorganización</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridad</Label>
                    <Select
                      value={formData.prioridad}
                      onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                    >
                      <option value="BAJA">Baja</option>
                      <option value="MEDIA">Media</option>
                      <option value="ALTA">Alta</option>
                      <option value="CRITICA">Crítica</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Observaciones</Label>
                  <Textarea
                    rows={3}
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas iniciales del caso..."
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
                  {saving ? 'Creando...' : 'Crear Caso'}
                </Button>
                <Link href="/casos">
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

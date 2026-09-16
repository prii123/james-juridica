'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, CheckCircle2 } from 'lucide-react'
import { TipoPersona } from '@prisma/client'
import { Button, Input, Textarea, Select, Label, FormHelp, Alert, Modal } from '@/components/ui'

export interface LeadBorrador {
  nombre: string
  email: string
  telefono: string
  documento?: string
  empresa?: string
  tipoPersona: TipoPersona
  observaciones?: string
}

interface Props {
  contactoId: string
  borrador: LeadBorrador
  onClose: () => void
  onCopiado?: (lead: { id: string; nombre: string }) => void
}

// Modal para crear un Lead en el sistema principal a partir de un contacto del bot.
// Los campos vienen precargados con lo que capturó el chatbot y se pueden ajustar antes de guardar.
export default function CopiarLeadModal({ contactoId, borrador, onClose, onCopiado }: Props) {
  const [form, setForm] = useState<LeadBorrador>({ ...borrador })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leadCreado, setLeadCreado] = useState<{ id: string; nombre: string } | null>(null)

  const set = (field: keyof LeadBorrador, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleGuardar = async () => {
    setGuardando(true)
    setError(null)
    try {
      const res = await fetch(`/api/bot/${contactoId}/copiar-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo crear el lead')
        return
      }
      setLeadCreado({ id: data.id, nombre: data.nombre })
      onCopiado?.({ id: data.id, nombre: data.nombre })
    } catch {
      setError('Error de conexión. Inténtelo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      title="Copiar a Leads"
      icon={<Copy size={18} />}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {leadCreado ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!leadCreado && (
            <Button
              onClick={handleGuardar}
              loading={guardando}
              disabled={!form.nombre.trim() || !form.email.trim() || !form.telefono.trim()}
            >
              {!guardando && <Copy size={16} />}
              Crear lead
            </Button>
          )}
        </>
      }
    >
      {leadCreado ? (
        <div className="py-3 text-center">
          <CheckCircle2 size={48} className="mx-auto mb-3 text-teal-700" />
          <h5 className="text-base font-semibold text-slate-800">Lead creado correctamente</h5>
          <p className="text-slate-500">
            <strong>{leadCreado.nombre}</strong> ya está disponible en la página de Leads.
          </p>
          <Link href={`/leads/${leadCreado.id}`}>
            <Button>Ver lead</Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            Revise y complete la información antes de crear el lead. Los campos marcados con * son obligatorios.
          </p>

          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                placeholder="El bot no capturó email"
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) => set('telefono', e.target.value.replace(/\D/g, ''))}
              />
              <FormHelp>Sin indicativo de país (10 dígitos).</FormHelp>
            </div>
            <div>
              <Label htmlFor="documento">Documento</Label>
              <Input
                id="documento"
                value={form.documento || ''}
                onChange={(e) => set('documento', e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div>
              <Label htmlFor="tipoPersona">Tipo de persona *</Label>
              <Select id="tipoPersona" value={form.tipoPersona} onChange={(e) => set('tipoPersona', e.target.value)}>
                <option value="NATURAL">Persona Natural</option>
                <option value="JURIDICA">Persona Jurídica</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input id="empresa" value={form.empresa || ''} onChange={(e) => set('empresa', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                rows={7}
                maxLength={1000}
                value={form.observaciones || ''}
                onChange={(e) => set('observaciones', e.target.value)}
              />
              <FormHelp>{(form.observaciones || '').length}/1000 · Origen: Bot WhatsApp</FormHelp>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}

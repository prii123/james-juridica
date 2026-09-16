'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, X, CheckCircle2 } from 'lucide-react'
import { TipoPersona } from '@prisma/client'

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
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <Copy size={18} />
              Copiar a Leads
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar" />
          </div>

          <div className="modal-body">
            {leadCreado ? (
              <div className="text-center py-3">
                <CheckCircle2 size={48} className="text-success mb-3" />
                <h5>Lead creado correctamente</h5>
                <p className="text-muted">
                  <strong>{leadCreado.nombre}</strong> ya está disponible en la página de Leads.
                </p>
                <Link href={`/leads/${leadCreado.id}`} className="btn btn-primary">
                  Ver lead
                </Link>
              </div>
            ) : (
              <>
                <p className="text-muted small mb-3">
                  Revise y complete la información antes de crear el lead. Los campos marcados con * son obligatorios.
                </p>

                {error && (
                  <div className="alert alert-danger py-2" role="alert">{error}</div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.nombre}
                      onChange={(e) => set('nombre', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      placeholder="El bot no capturó email"
                      onChange={(e) => set('email', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Teléfono *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.telefono}
                      onChange={(e) => set('telefono', e.target.value.replace(/\D/g, ''))}
                    />
                    <div className="form-text">Sin indicativo de país (10 dígitos).</div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Documento</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.documento || ''}
                      onChange={(e) => set('documento', e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Tipo de persona *</label>
                    <select
                      className="form-select"
                      value={form.tipoPersona}
                      onChange={(e) => set('tipoPersona', e.target.value)}
                    >
                      <option value="NATURAL">Persona Natural</option>
                      <option value="JURIDICA">Persona Jurídica</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Empresa</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.empresa || ''}
                      onChange={(e) => set('empresa', e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Observaciones</label>
                    <textarea
                      className="form-control"
                      rows={7}
                      maxLength={1000}
                      value={form.observaciones || ''}
                      onChange={(e) => set('observaciones', e.target.value)}
                    />
                    <div className="form-text">{(form.observaciones || '').length}/1000 · Origen: Bot WhatsApp</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={onClose}>
              <X size={16} />
              {leadCreado ? 'Cerrar' : 'Cancelar'}
            </button>
            {!leadCreado && (
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={handleGuardar}
                disabled={guardando || !form.nombre.trim() || !form.email.trim() || !form.telefono.trim()}
              >
                {guardando ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <Copy size={16} />
                )}
                Crear lead
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

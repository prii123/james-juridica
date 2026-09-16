'use client'

import { useState } from 'react'
import { Mail, MessageCircle, Send, X } from 'lucide-react'

interface Props {
  facturaId: string
  tipo: 'factura' | 'financiacion' | 'cuotas'
  clienteNombre: string
  email?: string
  telefono?: string
  onClose: () => void
}

export default function EnviarFacturaModal({ facturaId, tipo, clienteNombre, email, telefono, onClose }: Props) {
  const [metodo, setMetodo] = useState<'EMAIL' | 'WHATSAPP'>(email ? 'EMAIL' : 'WHATSAPP')
  const [destinatario, setDestinatario] = useState(
    metodo === 'EMAIL' ? (email || '') : (telefono || '')
  )
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  const apiUrl = tipo === 'factura'
    ? `/api/enviar/factura/${facturaId}`
    : tipo === 'financiacion'
      ? `/api/enviar/financiacion/${facturaId}`
      : `/api/enviar/cuotas/${facturaId}`

  const handleEnviar = async () => {
    if (!destinatario.trim()) return
    setEnviando(true)
    setResultado(null)

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metodo, destinatario: destinatario.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setResultado({ ok: true, msg: `Enviado por ${metodo === 'EMAIL' ? 'email' : 'WhatsApp'} a ${data.destinatario}` })
      } else {
        setResultado({ ok: false, msg: data.error || 'Error al enviar' })
      }
    } catch {
      setResultado({ ok: false, msg: 'Error de conexion' })
    } finally {
      setEnviando(false)
    }
  }

  const titulo = tipo === 'factura' ? 'Enviar Factura' : tipo === 'financiacion' ? 'Enviar Plan de Financiacion' : 'Enviar Estado de Cuenta'

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <Send size={18} />
              {titulo}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={enviando} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Cliente</label>
              <div className="form-control bg-light">{clienteNombre}</div>
            </div>

            <div className="mb-3">
              <label className="form-label">Metodo de envio</label>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${metodo === 'EMAIL' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => { setMetodo('EMAIL'); setDestinatario(email || '') }}
                  disabled={!email}
                >
                  <Mail size={16} />
                  Email
                </button>
                <button
                  type="button"
                  className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${metodo === 'WHATSAPP' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => { setMetodo('WHATSAPP'); setDestinatario(telefono || '') }}
                  disabled={!telefono}
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">
                {metodo === 'EMAIL' ? 'Correo electronico' : 'Numero de WhatsApp'}
              </label>
              <input
                type={metodo === 'EMAIL' ? 'email' : 'tel'}
                className="form-control"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder={metodo === 'EMAIL' ? 'cliente@email.com' : '573001234567'}
              />
            </div>

            {resultado && (
              <div className={`alert ${resultado.ok ? 'alert-success' : 'alert-danger'} mb-0`}>
                {resultado.ok ? (
                  <span className="d-flex align-items-center gap-1">{resultado.msg}</span>
                ) : (
                  resultado.msg
                )}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={enviando}>
              <X size={16} className="me-1" />
              Cerrar
            </button>
            {!resultado?.ok && (
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={handleEnviar}
                disabled={enviando || !destinatario.trim()}
              >
                {enviando ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <Send size={16} />
                )}
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

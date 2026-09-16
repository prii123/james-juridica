'use client'

import { useState } from 'react'
import { Mail, MessageCircle, Send } from 'lucide-react'
import { Button, Modal, Input, Label, Alert } from '@/components/ui'
import { cn } from '@/lib/utils'

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
    <Modal
      onClose={enviando ? () => {} : onClose}
      title={titulo}
      icon={<Send size={18} />}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={enviando}>
            Cerrar
          </Button>
          {!resultado?.ok && (
            <Button onClick={handleEnviar} loading={enviando} disabled={!destinatario.trim()}>
              {!enviando && <Send size={16} />}
              {enviando ? 'Enviando...' : 'Enviar'}
            </Button>
          )}
        </>
      }
    >
      <div className="mb-3">
        <Label>Cliente</Label>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{clienteNombre}</div>
      </div>

      <div className="mb-3">
        <Label>Metodo de envio</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={metodo === 'EMAIL' ? 'primary' : 'outlinePrimary'}
            className="flex-1 justify-center"
            onClick={() => { setMetodo('EMAIL'); setDestinatario(email || '') }}
            disabled={!email}
          >
            <Mail size={16} />
            Email
          </Button>
          <Button
            type="button"
            variant={metodo === 'WHATSAPP' ? 'success' : 'outline'}
            className={cn('flex-1 justify-center', metodo !== 'WHATSAPP' && 'border-teal-700 text-teal-700 hover:bg-teal-50')}
            onClick={() => { setMetodo('WHATSAPP'); setDestinatario(telefono || '') }}
            disabled={!telefono}
          >
            <MessageCircle size={16} />
            WhatsApp
          </Button>
        </div>
      </div>

      <div className="mb-3">
        <Label>{metodo === 'EMAIL' ? 'Correo electronico' : 'Numero de WhatsApp'}</Label>
        <Input
          type={metodo === 'EMAIL' ? 'email' : 'tel'}
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          placeholder={metodo === 'EMAIL' ? 'cliente@email.com' : '573001234567'}
        />
      </div>

      {resultado && (
        <Alert variant={resultado.ok ? 'success' : 'danger'}>{resultado.msg}</Alert>
      )}
    </Modal>
  )
}

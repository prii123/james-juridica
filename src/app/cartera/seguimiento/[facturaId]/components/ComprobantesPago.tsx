'use client'

import { useState } from 'react'
import { CheckCircle, ExternalLink, ImageIcon, XCircle } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Modal, Textarea, Label } from '@/components/ui'

export interface ComprobanteItem {
  id: string
  estado: 'PENDIENTE_REVISION' | 'APROBADO' | 'RECHAZADO'
  nombreOriginal: string | null
  tipoMime: string
  tamano: number
  telefono: string
  observaciones: string | null
  createdAt: string
  url: string
}

interface Props {
  comprobantes: ComprobanteItem[]
  error?: string | null
  onAplicar: (comprobante: ComprobanteItem) => void
  /** Se llama después de rechazar un comprobante, para recargar la lista. */
  onRechazado: () => void
}

const ESTADOS = {
  PENDIENTE_REVISION: { variant: 'warning', label: 'Pendiente' },
  APROBADO: { variant: 'success', label: 'Aplicado' },
  RECHAZADO: { variant: 'danger', label: 'Rechazado' },
} as const

export default function ComprobantesPago({ comprobantes, error, onAplicar, onRechazado }: Props) {
  const [rechazando, setRechazando] = useState<ComprobanteItem | null>(null)
  const [motivo, setMotivo] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorRechazo, setErrorRechazo] = useState('')

  const cerrarRechazo = () => {
    setRechazando(null)
    setMotivo('')
    setErrorRechazo('')
  }

  const confirmarRechazo = async () => {
    if (!rechazando) return
    try {
      setSaving(true)
      setErrorRechazo('')
      const res = await fetch(`/api/cartera/comprobantes/rechazar/${rechazando.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo rechazar el comprobante')
      cerrarRechazo()
      onRechazado()
    } catch (e: any) {
      setErrorRechazo(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon size={16} />
          Comprobantes de pago
        </CardTitle>
        <Badge variant="primary">{comprobantes.length}</Badge>
      </CardHeader>
      <CardBody className="p-0">
        {error ? (
          <p className="mb-0 px-4 py-3 text-sm text-red-600">No se pudieron cargar los comprobantes: {error}</p>
        ) : comprobantes.length === 0 ? (
          <p className="mb-0 px-4 py-3 text-sm text-slate-500">El cliente no ha enviado comprobantes.</p>
        ) : (
          <ul className="m-0 list-none divide-y divide-slate-100 p-0">
            {comprobantes.map((c, i) => {
              const estado = ESTADOS[c.estado]
              return (
                <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-semibold text-blue-800 hover:underline"
                    >
                      Comprobante {comprobantes.length - i}
                      <ExternalLink size={12} />
                    </a>
                    <div className="text-xs text-slate-500">
                      {new Date(c.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                    {c.estado === 'RECHAZADO' && c.observaciones && (
                      <div className="text-xs text-red-600">Motivo: {c.observaciones}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={estado.variant}>{estado.label}</Badge>
                    {c.estado === 'PENDIENTE_REVISION' && (
                      <>
                        <Button size="sm" variant="outlineDanger" title="No es un comprobante de pago" onClick={() => setRechazando(c)}>
                          <XCircle size={14} />
                          Rechazar
                        </Button>
                        <Button size="sm" variant="success" onClick={() => onAplicar(c)}>
                          <CheckCircle size={14} />
                          Aplicar
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardBody>
    </Card>

      {rechazando && (
        <Modal
          onClose={cerrarRechazo}
          title="Rechazar comprobante"
          icon={<XCircle size={18} />}
          footer={
            <>
              <Button type="button" variant="outline" onClick={cerrarRechazo} disabled={saving}>Cancelar</Button>
              <Button type="button" variant="danger" onClick={confirmarRechazo} loading={saving}>
                {saving ? 'Rechazando...' : 'Rechazar'}
              </Button>
            </>
          }
        >
          {errorRechazo && <Alert variant="danger" className="mb-3">{errorRechazo}</Alert>}
          <p className="mb-3 text-sm text-slate-600">
            El soporte quedará como <strong>Rechazado</strong> y dejará de contar como pendiente. No se registra ningún pago.
          </p>
          <Label>Motivo (opcional)</Label>
          <Textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej.: la imagen no es un comprobante de pago"
          />
        </Modal>
      )}
    </>
  )
}

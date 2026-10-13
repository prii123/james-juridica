'use client'

import { CheckCircle, ExternalLink, ImageIcon } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge } from '@/components/ui'

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
}

const ESTADOS = {
  PENDIENTE_REVISION: { variant: 'warning', label: 'Pendiente' },
  APROBADO: { variant: 'success', label: 'Aplicado' },
  RECHAZADO: { variant: 'danger', label: 'Rechazado' },
} as const

export default function ComprobantesPago({ comprobantes, error, onAplicar }: Props) {
  return (
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
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={estado.variant}>{estado.label}</Badge>
                    {c.estado === 'PENDIENTE_REVISION' && (
                      <Button size="sm" variant="success" onClick={() => onAplicar(c)}>
                        <CheckCircle size={14} />
                        Aplicar
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}

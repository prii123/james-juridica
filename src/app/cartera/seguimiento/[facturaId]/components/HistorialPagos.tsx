'use client'

import {
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardBody, Badge, type BadgeProps } from '@/components/ui'

interface PagoHistorial {
  id: string
  valor: number
  fecha: string
  metodoPago: string
  referencia?: string
  observaciones?: string
  distribucion: Array<{
    cuotaNumero: number
    valorAplicado: number
    fechaAplicacion: string
  }>
}

interface Props {
  pagos: PagoHistorial[]
  formatCurrency: (value: number) => string
}

const METODO_BADGE: Record<string, BadgeProps['variant']> = {
  EFECTIVO: 'success',
  TRANSFERENCIA: 'primary',
  CONSIGNACION: 'info',
  CHEQUE: 'warning',
  TARJETA_CREDITO: 'secondary',
  TARJETA_DEBITO: 'secondary',
}

export default function HistorialPagos({ pagos, formatCurrency }: Props) {
  const [pagoExpanded, setPagoExpanded] = useState<string | null>(null)

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'TRANSFERENCIA':
      case 'CONSIGNACION':
        return <CreditCard size={14} />
      case 'EFECTIVO':
        return <DollarSign size={14} />
      default:
        return <FileText size={14} />
    }
  }

  const toggleExpanded = (pagoId: string) => {
    setPagoExpanded(pagoExpanded === pagoId ? null : pagoId)
  }

  if (pagos.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Historial de Pagos</CardTitle></CardHeader>
        <CardBody className="py-4 text-center">
          <DollarSign size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No hay pagos registrados</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Pagos</CardTitle>
        <Badge variant="primary">{pagos.length} pagos</Badge>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-slate-100">
          {pagos.map((pago) => (
            <div key={pago.id} className="p-4">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => toggleExpanded(pago.id)}
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    {getMetodoPagoIcon(pago.metodoPago)}
                    <span className="font-bold text-slate-800">{formatCurrency(pago.valor)}</span>
                    <Badge variant={METODO_BADGE[pago.metodoPago] || 'secondary'}>
                      {pago.metodoPago.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center text-xs text-slate-500">
                    <Calendar size={12} className="mr-1" />
                    {new Date(pago.fecha).toLocaleDateString()}
                    {pago.referencia && (
                      <>
                        <span className="mx-1">•</span>
                        <span>Ref: {pago.referencia}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {pago.distribucion.length} cuota{pago.distribucion.length !== 1 ? 's' : ''}
                  </Badge>
                  {pagoExpanded === pago.id ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )}
                </div>
              </button>

              {/* Detalle Expandido */}
              {pagoExpanded === pago.id && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {pago.observaciones && (
                    <div className="mb-3">
                      <small className="text-slate-500">Observaciones:</small>
                      <div className="text-sm">{pago.observaciones}</div>
                    </div>
                  )}

                  <div className="mb-2">
                    <small className="font-bold text-slate-500">Distribución por Cuotas:</small>
                  </div>

                  <table className="w-full text-sm">
                    <tbody>
                      {pago.distribucion.map((dist, i) => (
                        <tr key={i}>
                          <td className="py-1"><Badge variant="outline">Cuota #{dist.cuotaNumero}</Badge></td>
                          <td className="py-1 text-right"><strong className="text-teal-700">{formatCurrency(dist.valorAplicado)}</strong></td>
                          <td className="py-1 text-right text-xs text-slate-500">{new Date(dist.fechaAplicacion).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200">
                        <td className="py-2 font-bold">TOTAL:</td>
                        <td className="py-2 text-right font-bold text-teal-700">{formatCurrency(pago.valor)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardBody>

      {/* Resumen Total */}
      <div className="flex items-center justify-between rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-slate-500">Total Pagado:</span>
        <span className="text-lg font-bold text-teal-700">
          {formatCurrency(pagos.reduce((sum, pago) => sum + pago.valor, 0))}
        </span>
      </div>
    </Card>
  )
}

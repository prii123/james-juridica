'use client'

import { useState } from 'react'
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react'
import { Button, Badge, Card, CardHeader, CardTitle, CardBody, Alert, Modal, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface CuotaSeguimiento {
  id: string
  numeroCuota: number
  valor: number
  capital: number
  interes: number
  saldo: number
  fechaVencimiento: string
  fechaPago?: string
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA'
  observaciones?: string
  valorPagado: number
  saldoCuota: number
  diasVencido: number
  pagosAplicados: Array<{
    id: string
    valorAplicado: number
    fechaAplicacion: string
    observaciones?: string
    pago: {
      id: string
      valor: number
      fecha: string
      metodoPago: string
      referencia?: string
      observaciones?: string
    }
  }>
}

interface Props {
  cuotas: CuotaSeguimiento[]
  formatCurrency: (value: number) => string
}

const ESTADO_BADGE: Record<CuotaSeguimiento['estado'], BadgeProps['variant']> = {
  PAGADA: 'success',
  VENCIDA: 'danger',
  PARCIAL: 'info',
  PENDIENTE: 'secondary',
}

export default function TimelineCuotas({ cuotas, formatCurrency }: Props) {
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<CuotaSeguimiento | null>(null)

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PAGADA':
        return <CheckCircle size={16} className="text-teal-700" />
      case 'VENCIDA':
        return <AlertTriangle size={16} className="text-red-600" />
      case 'PARCIAL':
        return <TrendingUp size={16} className="text-sky-700" />
      default:
        return <Clock size={16} className="text-slate-500" />
    }
  }

  const getEstadoBadge = (cuota: CuotaSeguimiento) => {
    const { estado, diasVencido } = cuota
    const labels: Record<CuotaSeguimiento['estado'], string> = {
      PAGADA: 'Pagada',
      VENCIDA: `Vencida${diasVencido > 0 ? ` (${diasVencido}d)` : ''}`,
      PARCIAL: 'Parcial',
      PENDIENTE: 'Pendiente',
    }
    return <Badge variant={ESTADO_BADGE[estado]}>{labels[estado]}</Badge>
  }

  const getProgresoCuota = (cuota: CuotaSeguimiento) => {
    return cuota.valor > 0 ? (cuota.valorPagado / cuota.valor) * 100 : 0
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold" style={{ width: '80px' }}>Cuota</th>
              <th className="px-3 py-2 font-semibold" style={{ width: '120px' }}>Vencimiento</th>
              <th className="px-3 py-2 font-semibold">Valor</th>
              <th className="px-3 py-2 font-semibold">Progreso</th>
              <th className="px-3 py-2 font-semibold" style={{ width: '100px' }}>Estado</th>
              <th className="px-3 py-2 font-semibold" style={{ width: '60px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cuotas.map((cuota) => (
              <tr key={cuota.id} className={cn(cuota.estado === 'VENCIDA' ? 'bg-red-50' : 'hover:bg-slate-50')}>
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center">
                    {getEstadoIcon(cuota.estado)}
                    <span className="ml-2 font-bold">#{cuota.numeroCuota}</span>
                  </div>
                </td>

                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(cuota.fechaVencimiento).toLocaleDateString()}
                  </div>
                  {cuota.fechaPago && (
                    <div className="text-xs text-teal-700">
                      Pagado: {new Date(cuota.fechaPago).toLocaleDateString()}
                    </div>
                  )}
                </td>

                <td className="px-3 py-2 align-middle">
                  <div>{formatCurrency(cuota.valor)}</div>
                  {cuota.valorPagado > 0 && (
                    <div className="text-xs text-teal-700">Pagado: {formatCurrency(cuota.valorPagado)}</div>
                  )}
                  {cuota.saldoCuota > 0 && (
                    <div className="text-xs text-amber-600">Saldo: {formatCurrency(cuota.saldoCuota)}</div>
                  )}
                </td>

                <td className="px-3 py-2 align-middle">
                  <div className="h-1.5 w-full max-w-[100px] overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        getProgresoCuota(cuota) === 100 ? 'bg-teal-600' :
                        getProgresoCuota(cuota) > 0 ? 'bg-sky-500' : 'bg-slate-300'
                      )}
                      style={{ width: `${getProgresoCuota(cuota)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{getProgresoCuota(cuota).toFixed(0)}%</div>
                </td>

                <td className="px-3 py-2 align-middle">{getEstadoBadge(cuota)}</td>

                <td className="px-3 py-2 align-middle">
                  <Button variant="outlinePrimary" size="icon" onClick={() => setCuotaSeleccionada(cuota)} title="Ver detalles">
                    <Eye size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalles de Cuota */}
      {cuotaSeleccionada && (
        <Modal
          onClose={() => setCuotaSeleccionada(null)}
          title={`Detalles de Cuota #${cuotaSeleccionada.numeroCuota}`}
          size="lg"
          footer={<Button variant="outline" onClick={() => setCuotaSeleccionada(null)}>Cerrar</Button>}
        >
          {/* Información General */}
          <Card className="mb-3">
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <div className="mb-2"><strong>Valor Total:</strong> {formatCurrency(cuotaSeleccionada.valor)}</div>
                  <div className="mb-2"><strong>Capital:</strong> {formatCurrency(cuotaSeleccionada.capital)}</div>
                  <div className="mb-2"><strong>Interés:</strong> {formatCurrency(cuotaSeleccionada.interes)}</div>
                </div>
                <div>
                  <div className="mb-2"><strong>Fecha Vencimiento:</strong> {new Date(cuotaSeleccionada.fechaVencimiento).toLocaleDateString()}</div>
                  <div className="mb-2"><strong>Estado:</strong> {getEstadoBadge(cuotaSeleccionada)}</div>
                  {cuotaSeleccionada.fechaPago && (
                    <div className="mb-2"><strong>Fecha Pago:</strong> {new Date(cuotaSeleccionada.fechaPago).toLocaleDateString()}</div>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-2 flex justify-between">
                  <span>Progreso de Pago:</span>
                  <span className="font-bold">{getProgresoCuota(cuotaSeleccionada).toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn('h-full rounded-full', getProgresoCuota(cuotaSeleccionada) === 100 ? 'bg-teal-600' : 'bg-sky-500')}
                    style={{ width: `${getProgresoCuota(cuotaSeleccionada)}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Historial de Pagos de esta Cuota */}
          {cuotaSeleccionada.pagosAplicados.length > 0 ? (
            <Card>
              <CardHeader><CardTitle>Pagos Aplicados ({cuotaSeleccionada.pagosAplicados.length})</CardTitle></CardHeader>
              <CardBody className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Fecha</th>
                      <th className="px-3 py-2 font-semibold">Valor Aplicado</th>
                      <th className="px-3 py-2 font-semibold">Método</th>
                      <th className="px-3 py-2 font-semibold">Referencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cuotaSeleccionada.pagosAplicados.map((aplicacion) => (
                      <tr key={aplicacion.id}>
                        <td className="px-3 py-2 align-middle"><small>{new Date(aplicacion.fechaAplicacion).toLocaleDateString()}</small></td>
                        <td className="px-3 py-2 align-middle"><strong className="text-teal-700">{formatCurrency(aplicacion.valorAplicado)}</strong></td>
                        <td className="px-3 py-2 align-middle"><Badge variant="outline">{aplicacion.pago.metodoPago}</Badge></td>
                        <td className="px-3 py-2 align-middle"><small>{aplicacion.pago.referencia || '-'}</small></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td className="px-3 py-2"><strong>Total:</strong></td>
                      <td className="px-3 py-2"><strong className="text-teal-700">{formatCurrency(cuotaSeleccionada.valorPagado)}</strong></td>
                      <td className="px-3 py-2" colSpan={2}>
                        <strong className="text-amber-600">Saldo: {formatCurrency(cuotaSeleccionada.saldoCuota)}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardBody>
            </Card>
          ) : (
            <Alert variant="info">
              <strong>Sin pagos aplicados</strong>
              <br />
              Esta cuota aún no tiene pagos registrados.
            </Alert>
          )}
        </Modal>
      )}
    </>
  )
}

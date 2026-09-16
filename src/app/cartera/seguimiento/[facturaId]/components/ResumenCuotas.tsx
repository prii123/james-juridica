'use client'

import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-react'
import { Card, CardBody } from '@/components/ui'

interface ResumenSeguimiento {
  totalPagado: number
  saldoPendiente: number
  cuotasPagadas: number
  cuotasVencidas: number
  cuotasParciales: number
  cuotasPendientes: number
  progresoPago: number
}

interface FacturaSeguimiento {
  id: string
  numero: string
  fecha: string
  total: number
  modalidadPago: string
  numeroCuotas?: number
  valorCuota?: number
  tasaInteres?: number
  cliente: {
    nombre: string
    apellido?: string
  }
  caso: {
    numeroCaso: string
  }
}

interface Props {
  resumen: ResumenSeguimiento
  factura: FacturaSeguimiento
  formatCurrency: (value: number) => string
}

export default function ResumenCuotas({ resumen, factura, formatCurrency }: Props) {
  const totalCuotas = factura.numeroCuotas || 0

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Progress General */}
      <Card className="h-full">
        <CardBody className="text-center">
          <div className="mb-3">
            <div className="mx-auto mb-2 h-2 w-32 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-600" style={{ width: `${resumen.progresoPago}%` }} />
            </div>
            <div className="mb-1 text-2xl font-bold text-teal-700">{resumen.progresoPago.toFixed(1)}%</div>
            <div className="text-sm text-slate-500">Progreso de Pago</div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-teal-700">{formatCurrency(resumen.totalPagado)}</div>
              <div className="text-sm text-slate-500">Pagado</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">{formatCurrency(resumen.saldoPendiente)}</div>
              <div className="text-sm text-slate-500">Pendiente</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Estados de Cuotas */}
      <Card className="h-full">
        <CardBody>
          <h6 className="mb-3 font-semibold text-slate-800">Estado de Cuotas</h6>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <CheckCircle size={16} className="mr-2 text-teal-700" />
              <div>
                <div className="font-bold text-slate-800">{resumen.cuotasPagadas}</div>
                <div className="text-sm text-slate-500">Pagadas</div>
              </div>
            </div>

            <div className="flex items-center">
              <AlertTriangle size={16} className="mr-2 text-red-600" />
              <div>
                <div className="font-bold text-slate-800">{resumen.cuotasVencidas}</div>
                <div className="text-sm text-slate-500">Vencidas</div>
              </div>
            </div>

            <div className="flex items-center">
              <TrendingUp size={16} className="mr-2 text-sky-700" />
              <div>
                <div className="font-bold text-slate-800">{resumen.cuotasParciales}</div>
                <div className="text-sm text-slate-500">Parciales</div>
              </div>
            </div>

            <div className="flex items-center">
              <Clock size={16} className="mr-2 text-slate-500" />
              <div>
                <div className="font-bold text-slate-800">{resumen.cuotasPendientes}</div>
                <div className="text-sm text-slate-500">Pendientes</div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Información de la Factura */}
      <div className="md:col-span-2">
        <Card>
          <CardBody>
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-sm text-slate-500">Total Factura</div>
                  <div className="font-bold text-slate-800">{formatCurrency(factura.total)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Cuotas</div>
                  <div className="font-bold text-slate-800">{totalCuotas} cuotas</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Valor por Cuota</div>
                  <div className="font-bold text-slate-800">
                    {factura.valorCuota ? formatCurrency(factura.valorCuota) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Interés Mensual</div>
                  <div className="font-bold text-slate-800">
                    {factura.tasaInteres ? `${factura.tasaInteres}%` : '0%'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Fecha Facturación</div>
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <Calendar size={14} />
                  {new Date(factura.fecha).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

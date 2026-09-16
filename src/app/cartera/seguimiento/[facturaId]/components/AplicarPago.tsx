'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  CreditCard,
  FileText,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Textarea, Label, Alert, Modal } from '@/components/ui'
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
}

interface DistribucionCuota {
  cuotaId: string
  numeroCuota: number
  valorAplicado: number
  saldoDisponible: number
}

interface Props {
  facturaId: string
  cuotas: CuotaSeguimiento[]
  onPagoAplicado: () => void
  onCancel: () => void
  formatCurrency: (value: number) => string
}

const FORM_ID = 'aplicar-pago-form'

export default function AplicarPago({
  facturaId,
  cuotas,
  onPagoAplicado,
  onCancel,
  formatCurrency
}: Props) {
  const [formData, setFormData] = useState({
    valor: '',
    metodoPago: 'TRANSFERENCIA',
    referencia: '',
    observaciones: ''
  })

  const [aplicacionAutomatica, setAplicacionAutomatica] = useState(true)
  const [distribucionManual, setDistribucionManual] = useState<DistribucionCuota[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [distribucionSugerida, setDistribucionSugerida] = useState<DistribucionCuota[]>([])

  // Cuotas disponibles para aplicar pagos (con saldo pendiente)
  const cuotasDisponibles = cuotas.filter(c => c.saldoCuota > 0)

  useEffect(() => {
    if (formData.valor && aplicacionAutomatica) {
      calcularDistribucionAutomatica()
    }
  }, [formData.valor, aplicacionAutomatica])

  useEffect(() => {
    if (!aplicacionAutomatica) {
      inicializarDistribucionManual()
    }
  }, [aplicacionAutomatica])

  const calcularDistribucionAutomatica = () => {
    const valor = parseFloat(formData.valor) || 0
    if (valor <= 0) {
      setDistribucionSugerida([])
      return
    }

    let montoRestante = valor
    const distribucion: DistribucionCuota[] = []

    const cuotasOrdenadas = cuotasDisponibles
      .sort((a, b) => {
        if (a.estado === 'VENCIDA' && b.estado !== 'VENCIDA') return -1
        if (a.estado !== 'VENCIDA' && b.estado === 'VENCIDA') return 1
        return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
      })

    for (const cuota of cuotasOrdenadas) {
      if (montoRestante <= 0) break

      const montoAplicar = Math.min(montoRestante, cuota.saldoCuota)
      if (montoAplicar > 0) {
        distribucion.push({
          cuotaId: cuota.id,
          numeroCuota: cuota.numeroCuota,
          valorAplicado: montoAplicar,
          saldoDisponible: cuota.saldoCuota
        })
        montoRestante -= montoAplicar
      }
    }

    setDistribucionSugerida(distribucion)
  }

  const inicializarDistribucionManual = () => {
    const distribucion = cuotasDisponibles.map(cuota => ({
      cuotaId: cuota.id,
      numeroCuota: cuota.numeroCuota,
      valorAplicado: 0,
      saldoDisponible: cuota.saldoCuota
    }))
    setDistribucionManual(distribucion)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDistribucionChange = (cuotaId: string, valor: number) => {
    setDistribucionManual(prev => prev.map(item =>
      item.cuotaId === cuotaId
        ? { ...item, valorAplicado: Math.max(0, Math.min(valor, item.saldoDisponible)) }
        : item
    ))
  }

  const getTotalDistribucionManual = () => {
    return distribucionManual.reduce((sum, item) => sum + item.valorAplicado, 0)
  }

  const validarFormulario = () => {
    const valor = parseFloat(formData.valor) || 0

    if (valor <= 0) {
      setError('El valor del pago debe ser mayor a 0')
      return false
    }

    if (!aplicacionAutomatica) {
      const totalDistribucion = getTotalDistribucionManual()
      if (Math.abs(totalDistribucion - valor) > 0.01) {
        setError(`La distribución manual (${formatCurrency(totalDistribucion)}) debe coincidir con el valor del pago (${formatCurrency(valor)})`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarFormulario()) return

    try {
      setSaving(true)
      setError('')

      const valor = parseFloat(formData.valor)
      const distribucionFinal = aplicacionAutomatica
        ? distribucionSugerida.map(item => ({
            cuotaId: item.cuotaId,
            valorAplicado: item.valorAplicado
          }))
        : distribucionManual.filter(item => item.valorAplicado > 0).map(item => ({
            cuotaId: item.cuotaId,
            valorAplicado: item.valorAplicado
          }))

      const response = await fetch('/api/cartera/aplicar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facturaId,
          valor,
          metodoPago: formData.metodoPago,
          referencia: formData.referencia || undefined,
          observaciones: formData.observaciones || undefined,
          distribucionCuotas: distribucionFinal,
          aplicacionAutomatica
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al aplicar el pago')
      }

      await onPagoAplicado()

    } catch (error: any) {
      setError(error.message || 'Error al aplicar el pago')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      onClose={onCancel}
      title="Registrar Pago"
      icon={<DollarSign size={20} />}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} variant="success" loading={saving} disabled={!formData.valor}>
            {!saving && <CheckCircle size={16} />}
            {saving ? 'Aplicando...' : 'Aplicar Pago'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit}>
        {error && (
          <Alert variant="danger" className="mb-4">
            <span className="flex items-center gap-2"><AlertTriangle size={16} />{error}</span>
          </Alert>
        )}

        {/* Información del Pago */}
        <Card className="mb-4">
          <CardHeader><CardTitle>Información del Pago</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="flex items-center gap-1"><DollarSign size={16} />Valor del Pago *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => handleInputChange('valor', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label className="flex items-center gap-1"><CreditCard size={16} />Método de Pago *</Label>
                <Select
                  value={formData.metodoPago}
                  onChange={(e) => handleInputChange('metodoPago', e.target.value)}
                  required
                >
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CONSIGNACION">Consignación</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                  <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="flex items-center gap-1"><FileText size={16} />Referencia</Label>
                <Input
                  type="text"
                  value={formData.referencia}
                  onChange={(e) => handleInputChange('referencia', e.target.value)}
                  placeholder="Número de transacción, cheque, etc."
                />
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Notas adicionales"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Modo de Aplicación */}
        <Card className="mb-4">
          <CardHeader><CardTitle>Modo de Aplicación</CardTitle></CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label htmlFor="automatica" className="flex items-start gap-2">
                <input
                  type="radio"
                  name="modoAplicacion"
                  id="automatica"
                  className="mt-1 h-4 w-4 accent-teal-600"
                  checked={aplicacionAutomatica}
                  onChange={() => setAplicacionAutomatica(true)}
                />
                <span>
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Zap size={16} className="text-teal-700" />
                    Automática
                  </span>
                  <span className="block text-sm text-slate-500">
                    Aplica a cuotas vencidas primero, luego cronológicamente
                  </span>
                </span>
              </label>
              <label htmlFor="manual" className="flex items-start gap-2">
                <input
                  type="radio"
                  name="modoAplicacion"
                  id="manual"
                  className="mt-1 h-4 w-4 accent-blue-800"
                  checked={!aplicacionAutomatica}
                  onChange={() => setAplicacionAutomatica(false)}
                />
                <span>
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Calculator size={16} className="text-blue-800" />
                    Manual
                  </span>
                  <span className="block text-sm text-slate-500">
                    Especifica el monto para cada cuota
                  </span>
                </span>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* Preview de Distribución */}
        {formData.valor && (
          <Card>
            <CardHeader>
              <CardTitle>{aplicacionAutomatica ? 'Vista Previa de Distribución' : 'Distribución Manual'}</CardTitle>
              {aplicacionAutomatica && distribucionSugerida.length > 0 && (
                <Badge variant="success">
                  <CheckCircle size={14} />
                  Distribución Válida
                </Badge>
              )}
            </CardHeader>
            <CardBody className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold" style={{ width: '80px' }}>Cuota</th>
                    <th className="px-3 py-2 font-semibold">Estado</th>
                    <th className="px-3 py-2 font-semibold">Saldo Disponible</th>
                    <th className="px-3 py-2 font-semibold">Valor a Aplicar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aplicacionAutomatica ? (
                    distribucionSugerida.map((item) => (
                      <tr key={item.cuotaId}>
                        <td className="px-3 py-2 align-middle"><Badge variant="primary">#{item.numeroCuota}</Badge></td>
                        <td className="px-3 py-2 align-middle">
                          {cuotas.find(c => c.id === item.cuotaId)?.estado === 'VENCIDA' && (
                            <Badge variant="danger">Vencida</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 align-middle">{formatCurrency(item.saldoDisponible)}</td>
                        <td className="px-3 py-2 align-middle"><strong className="text-teal-700">{formatCurrency(item.valorAplicado)}</strong></td>
                      </tr>
                    ))
                  ) : (
                    distribucionManual.map((item) => (
                      <tr key={item.cuotaId}>
                        <td className="px-3 py-2 align-middle"><Badge variant="primary">#{item.numeroCuota}</Badge></td>
                        <td className="px-3 py-2 align-middle">
                          {cuotas.find(c => c.id === item.cuotaId)?.estado === 'VENCIDA' && (
                            <Badge variant="danger">Vencida</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 align-middle">{formatCurrency(item.saldoDisponible)}</td>
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="number"
                            className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
                            min="0"
                            max={item.saldoDisponible}
                            step="0.01"
                            value={item.valorAplicado}
                            onChange={(e) => handleDistribucionChange(item.cuotaId, parseFloat(e.target.value) || 0)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {!aplicacionAutomatica && (
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td className="px-3 py-2" colSpan={3}><strong>Total Distribuido:</strong></td>
                      <td className="px-3 py-2">
                        <strong className={cn(
                          Math.abs(getTotalDistribucionManual() - (parseFloat(formData.valor) || 0)) < 0.01
                            ? 'text-teal-700'
                            : 'text-red-600'
                        )}>
                          {formatCurrency(getTotalDistribucionManual())}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </CardBody>
          </Card>
        )}
      </form>
    </Modal>
  )
}

import { MetodoPago, Prisma, PrismaClient } from '@prisma/client'
import { calcularCuotas } from '@/lib/cartera/calcular-cuotas'

type Db = Prisma.TransactionClient | PrismaClient

interface Opciones {
  financiado: boolean
  numeroCuotas?: number | null
  tasaInteres?: number | null
  /** Lo que el cliente ya pagó al momento de crear la factura (abono inicial). */
  valorPagado?: number | null
  metodoPago?: MetodoPago
}

/**
 * Se llama justo después de crear una factura:
 *  - si hay valor pagado, lo registra como un Pago;
 *  - si es a crédito, genera las cuotas sobre el saldo que queda (total - pagado), igual que lo
 *    hacen cartera/financiacion y aplicar-pago cuando generan las cuotas a posteriori;
 *  - si el pago cubre el total, la factura queda PAGADA.
 */
export async function registrarPagoInicialYCuotas(
  db: Db,
  factura: { id: string; total: number },
  { financiado, numeroCuotas, tasaInteres, valorPagado, metodoPago }: Opciones,
) {
  const pagado = valorPagado && valorPagado > 0 ? valorPagado : 0
  if (pagado > factura.total + 0.01) {
    throw new Error('El valor pagado no puede ser mayor al total de la factura')
  }

  if (pagado > 0) {
    await db.pago.create({
      data: {
        facturaId: factura.id,
        valor: pagado,
        metodoPago: metodoPago || 'EFECTIVO',
        observaciones: 'Pago inicial registrado al crear la factura',
      },
    })
  }

  const saldo = Math.max(0, factura.total - pagado)

  if (saldo <= 0.01) {
    await db.factura.update({ where: { id: factura.id }, data: { estado: 'PAGADA' } })
    return
  }

  if (financiado && numeroCuotas && numeroCuotas >= 2) {
    const cuotas = calcularCuotas(saldo, numeroCuotas, tasaInteres || 0, new Date())
    await db.cuotaFactura.createMany({
      data: cuotas.map((c) => ({
        facturaId: factura.id,
        numeroCuota: c.numeroCuota,
        fechaVencimiento: c.fechaVencimiento,
        valor: c.valor,
        capital: c.capital,
        interes: c.interes,
        saldo: c.saldo,
        valorPagado: 0,
        saldoCuota: c.valor,
      })),
    })
    await db.factura.update({ where: { id: factura.id }, data: { valorCuota: cuotas[0].valor } })
  }
}

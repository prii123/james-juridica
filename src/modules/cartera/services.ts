import { MetodoPago } from '@prisma/client'
import { prisma } from '@/lib/db'
import { calcularCuotas } from '@/lib/cartera/calcular-cuotas'

/** Fila del CSV tal como llega: todo texto; acá se valida y convierte. */
export interface FilaPagoMasivo {
  numeroFactura?: string
  valor?: string
  fecha?: string
  metodoPago?: string
  referencia?: string
  observaciones?: string
}

const METODOS: Record<string, MetodoPago> = {
  efectivo: 'EFECTIVO',
  transferencia: 'TRANSFERENCIA',
  consignacion: 'CONSIGNACION',
  cheque: 'CHEQUE',
  tarjetacredito: 'TARJETA_CREDITO',
  tarjetadebito: 'TARJETA_DEBITO',
}

const limpio = (v?: string) => (v ?? '').trim()
const norm = (v?: string) => limpio(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '')

/** "1500000", "1.500.000", "$ 1,500,000" o "2,5" -> número; NaN si no se entiende. */
function numero(v?: string): number {
  let s = limpio(v).replace(/[$\s]/g, '')
  if (!s) return NaN
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '')
  else s = s.replace(',', '.')
  return Number(s)
}

/** YYYY-MM-DD o DD/MM/YYYY. */
function fecha(v?: string): Date | null {
  const s = limpio(v)
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12)
  return null
}

export class CarteraService {
  /**
   * Registra pagos desde las filas de un CSV y los abona de forma automática a las cuotas de la
   * factura (primero las vencidas y luego por fecha de vencimiento, igual que el pago individual
   * con aplicación automática). Las filas se procesan en orden y cada una es independiente: si
   * una falla se informa y se sigue con las demás.
   */
  async pagosMasivos(filas: FilaPagoMasivo[]) {
    const errores: { fila: number; numeroFactura?: string; error: string }[] = []
    let aplicados = 0
    let totalAplicado = 0

    for (let i = 0; i < filas.length; i++) {
      try {
        totalAplicado += await this.aplicarPago(filas[i])
        aplicados++
      } catch (e: any) {
        errores.push({ fila: i + 1, numeroFactura: limpio(filas[i].numeroFactura), error: e.message })
      }
    }

    return { total: filas.length, aplicados, totalAplicado, errores }
  }

  private async aplicarPago(f: FilaPagoMasivo): Promise<number> {
    const numeroFactura = limpio(f.numeroFactura)
    if (!numeroFactura) throw new Error('Falta numeroFactura')

    const valor = numero(f.valor)
    if (!Number.isFinite(valor) || valor <= 0) throw new Error('valor debe ser un número mayor a 0')

    let fechaPago = new Date()
    if (limpio(f.fecha)) {
      const d = fecha(f.fecha)
      if (!d) throw new Error('fecha no válida (use AAAA-MM-DD o DD/MM/AAAA)')
      fechaPago = d
    }

    let metodoPago: MetodoPago = 'TRANSFERENCIA'
    if (limpio(f.metodoPago)) {
      const m = METODOS[norm(f.metodoPago)]
      if (!m) throw new Error('metodoPago no válido (EFECTIVO, TRANSFERENCIA, CONSIGNACION, CHEQUE, TARJETA_CREDITO, TARJETA_DEBITO)')
      metodoPago = m
    }

    const factura = await prisma.factura.findUnique({
      where: { numero: numeroFactura },
      include: {
        pagos: { select: { valor: true } },
        cuotasFactura: { include: { abonosPagos: true }, orderBy: { numeroCuota: 'asc' } },
      },
    })
    if (!factura) throw new Error(`La factura ${numeroFactura} no existe`)
    if (factura.estado === 'ANULADA') throw new Error(`La factura ${numeroFactura} está anulada`)

    const totalPagado = factura.pagos.reduce((s, p) => s + Number(p.valor), 0)
    const saldoFactura = Number(factura.total) - totalPagado
    if (saldoFactura <= 0.01) throw new Error(`La factura ${numeroFactura} ya está pagada`)
    if (valor > saldoFactura + 0.01) {
      throw new Error(`El valor (${valor}) supera el saldo de la factura ${numeroFactura} (${saldoFactura})`)
    }

    // Factura a crédito sin cuotas generadas todavía: se generan sobre el saldo, como al pagar a mano.
    let cuotas = factura.cuotasFactura
    if (cuotas.length === 0 && factura.numeroCuotas && factura.numeroCuotas > 1) {
      const nuevas = calcularCuotas(saldoFactura, factura.numeroCuotas, Number(factura.tasaInteres || 0), new Date())
      await prisma.cuotaFactura.createMany({
        data: nuevas.map((c) => ({
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
      cuotas = await prisma.cuotaFactura.findMany({
        where: { facturaId: factura.id },
        include: { abonosPagos: true },
        orderBy: { numeroCuota: 'asc' },
      })
    }

    // Distribución automática: vencidas primero, luego por fecha de vencimiento.
    const ahora = new Date()
    const pendientes = cuotas
      .map((c) => ({
        c,
        saldo: Math.max(0, Number(c.valor) - c.abonosPagos.reduce((s, a) => s + Number(a.valorAplicado), 0)),
        vencida: new Date(c.fechaVencimiento) < ahora,
      }))
      .filter((x) => x.saldo > 0)
      .sort((a, b) => {
        if (a.vencida !== b.vencida) return a.vencida ? -1 : 1
        return new Date(a.c.fechaVencimiento).getTime() - new Date(b.c.fechaVencimiento).getTime()
      })

    const distribucion: { cuotaId: string; valorAplicado: number; saldoNuevo: number; valorCuota: number; pagadoAntes: number }[] = []
    if (cuotas.length > 0) {
      let restante = valor
      for (const x of pendientes) {
        if (restante <= 0.009) break
        const aplicar = Math.min(restante, x.saldo)
        distribucion.push({
          cuotaId: x.c.id,
          valorAplicado: aplicar,
          saldoNuevo: x.saldo - aplicar,
          valorCuota: Number(x.c.valor),
          pagadoAntes: Number(x.c.valor) - x.saldo,
        })
        restante -= aplicar
      }
      if (restante > 0.01) {
        throw new Error(`El valor supera lo pendiente en las cuotas de la factura ${numeroFactura}`)
      }
    }

    await prisma.$transaction(async (tx) => {
      const pago = await tx.pago.create({
        data: {
          facturaId: factura.id,
          valor,
          fecha: fechaPago,
          metodoPago,
          referencia: limpio(f.referencia) || null,
          observaciones: limpio(f.observaciones) || 'Pago masivo',
        },
      })

      for (const d of distribucion) {
        await tx.pagoCuota.create({
          data: { pagoId: pago.id, cuotaId: d.cuotaId, valorAplicado: d.valorAplicado, observaciones: 'Aplicación automática' },
        })
        const pagado = d.pagadoAntes + d.valorAplicado
        const pagada = pagado >= d.valorCuota - 0.01
        await tx.cuotaFactura.update({
          where: { id: d.cuotaId },
          data: {
            estado: pagada ? 'PAGADA' : 'PARCIAL',
            fechaPago: pagada ? fechaPago : null,
            valorPagado: pagado,
            saldoCuota: Math.max(0, d.valorCuota - pagado),
          },
        })
      }

      // Con todo el saldo cubierto la factura queda pagada.
      if (saldoFactura - valor <= 0.01) {
        await tx.factura.update({ where: { id: factura.id }, data: { estado: 'PAGADA' } })
      }
    })

    return valor
  }
}

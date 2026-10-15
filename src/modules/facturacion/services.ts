import { prisma } from '@/lib/db'
import { registrarPagoInicialYCuotas } from '@/lib/facturacion-credito'

/** Fila del CSV tal como llega: todo texto; acá se valida y convierte. */
export interface FilaFacturaMasiva {
  factura?: string
  clienteDocumento?: string
  clienteEmail?: string
  producto?: string
  cantidad?: string
  valorUnitario?: string
  fecha?: string
  fechaVencimiento?: string
  modalidadPago?: string
  numeroCuotas?: string
  tasaInteres?: string
  iva?: string
  observaciones?: string
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
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  return null
}

export class FacturacionService {
  /**
   * Crea facturas desde filas de un CSV. Las filas con el mismo valor en `factura` forman una sola
   * factura con varios items (los datos generales se toman de la primera fila del grupo); si
   * `factura` va vacío, cada fila es su propia factura. Cada factura es independiente: si una
   * falla se informa y se sigue con las demás.
   */
  async crearMasivo(filas: FilaFacturaMasiva[], creadoPorId: string) {
    const grupos = new Map<string, { filas: FilaFacturaMasiva[]; numerosFila: number[] }>()
    filas.forEach((f, i) => {
      const clave = limpio(f.factura) || `__fila_${i}`
      const g = grupos.get(clave) || { filas: [], numerosFila: [] }
      g.filas.push(f)
      g.numerosFila.push(i + 1)
      grupos.set(clave, g)
    })

    const errores: { fila: number; error: string }[] = []
    const creadas: string[] = []

    for (const g of Array.from(grupos.values())) {
      try {
        creadas.push(await this.crearDesdeGrupo(g.filas, g.numerosFila, creadoPorId))
      } catch (e: any) {
        errores.push({ fila: g.numerosFila[0], error: e.message })
      }
    }

    return { total: grupos.size, creadas: creadas.length, numeros: creadas, errores }
  }

  private async crearDesdeGrupo(filas: FilaFacturaMasiva[], numerosFila: number[], creadoPorId: string) {
    const cab = filas[0]

    // Cliente: debe existir (por documento o, si no hay, por email).
    const documento = limpio(cab.clienteDocumento)
    const email = limpio(cab.clienteEmail).toLowerCase()
    if (!documento && !email) throw new Error('Falta clienteDocumento o clienteEmail')
    const cliente = documento
      ? await prisma.cliente.findUnique({ where: { documento } })
      : await prisma.cliente.findUnique({ where: { email } })
    if (!cliente) throw new Error(`El cliente ${documento || email} no existe: créalo primero en Clientes`)

    // Items: cada fila apunta a un producto/servicio del catálogo por nombre.
    const items: { productoId: string; descripcion: string; cantidad: number; valorUnitario: number; valorTotal: number }[] = []
    for (let i = 0; i < filas.length; i++) {
      const f = filas[i]
      const nombre = limpio(f.producto)
      if (!nombre) throw new Error(`Fila ${numerosFila[i]}: falta el producto o servicio`)
      const producto = await prisma.producto.findFirst({
        where: { nombre: { equals: nombre, mode: 'insensitive' }, activo: true },
      })
      if (!producto) throw new Error(`Fila ${numerosFila[i]}: el producto o servicio "${nombre}" no existe en el catálogo`)

      const cantidad = limpio(f.cantidad) ? numero(f.cantidad) : 1
      if (!Number.isInteger(cantidad) || cantidad < 1) throw new Error(`Fila ${numerosFila[i]}: cantidad no válida`)
      const valorUnitario = limpio(f.valorUnitario) ? numero(f.valorUnitario) : Number(producto.precio)
      if (!Number.isFinite(valorUnitario) || valorUnitario < 0) throw new Error(`Fila ${numerosFila[i]}: valorUnitario no válido`)

      items.push({ productoId: producto.id, descripcion: producto.nombre, cantidad, valorUnitario, valorTotal: cantidad * valorUnitario })
    }

    const subtotal = items.reduce((s, it) => s + it.valorTotal, 0)
    const aplicaIva = ['si', 's', 'true', '1'].includes(norm(cab.iva)) || norm(cab.iva) === 'x'
    const impuestos = aplicaIva ? subtotal * 0.19 : 0
    const total = subtotal + impuestos

    // Fecha de creación: por defecto hoy.
    let fechaFactura = fecha(cab.fecha)
    if (limpio(cab.fecha) && !fechaFactura) throw new Error('fecha no válida (use AAAA-MM-DD o DD/MM/AAAA)')
    if (!fechaFactura) fechaFactura = new Date()

    // Fecha de vencimiento: por defecto 30 días después de la fecha de creación.
    let vencimiento = fecha(cab.fechaVencimiento)
    if (limpio(cab.fechaVencimiento) && !vencimiento) throw new Error('fechaVencimiento no válida (use AAAA-MM-DD o DD/MM/AAAA)')
    if (!vencimiento) {
      vencimiento = new Date(fechaFactura)
      vencimiento.setDate(vencimiento.getDate() + 30)
    } else if (vencimiento.getTime() < new Date(fechaFactura.getFullYear(), fechaFactura.getMonth(), fechaFactura.getDate()).getTime()) {
      throw new Error('fechaVencimiento no puede ser anterior a la fecha de creación')
    }

    // Modalidad: crédito exige cantidad de cuotas.
    const modalidad = norm(cab.modalidadPago)
    if (modalidad && !modalidad.startsWith('cont') && !modalidad.startsWith('cred')) {
      throw new Error('modalidadPago debe ser CONTADO o CREDITO')
    }
    const financiado = modalidad.startsWith('cred')
    let numeroCuotas: number | undefined
    let tasaInteres = 0
    if (financiado) {
      numeroCuotas = numero(cab.numeroCuotas)
      if (!Number.isInteger(numeroCuotas) || numeroCuotas < 2 || numeroCuotas > 60) {
        throw new Error('Para crédito, numeroCuotas debe ser un entero entre 2 y 60')
      }
      if (limpio(cab.tasaInteres)) {
        tasaInteres = numero(cab.tasaInteres)
        if (!Number.isFinite(tasaInteres) || tasaInteres < 0 || tasaInteres > 10) throw new Error('tasaInteres debe estar entre 0 y 10 (% mensual)')
      }
    }

    return prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear()
      const count = await tx.factura.count({ where: { numero: { startsWith: `FACT-${year}-` } } })
      const numero = `FACT-${year}-${(count + 1).toString().padStart(4, '0')}`

      const factura = await tx.factura.create({
        data: {
          numero,
          fecha: fechaFactura,
          fechaVencimiento: vencimiento!,
          subtotal,
          impuestos,
          total,
          estado: 'GENERADA',
          modalidadPago: financiado ? 'FINANCIADO' : 'CONTADO',
          ...(financiado && { numeroCuotas, tasaInteres }),
          observaciones: limpio(cab.observaciones),
          ivaActivado: aplicaIva,
          clienteId: cliente.id,
          creadoPorId,
          items: { create: items },
        },
      })

      await registrarPagoInicialYCuotas(tx, { id: factura.id, total }, {
        financiado,
        numeroCuotas,
        tasaInteres,
      })

      return numero
    })
  }
}

import { prisma } from './db'
import { Decimal } from '@prisma/client/runtime/library'

// Tipos para facturación
export interface BillingItem {
  descripcion: string
  cantidad: number
  valorUnitario: number
  valorTotal: number
}

// Interfaz simplificada para crear facturas desde honorarios
export interface FacturaData {
  honorarioId: string
  observaciones?: string
}

// Configuración de impuestos
export const TAX_CONFIG = {
  IVA: 0.19, // 19%
  RETEFUENTE: 0.11, // 11% para servicios profesionales
  ICA: 0.00966, // 9.66 por mil (Bogotá)
} as const

// Tarifas base para servicios jurídicos
export const TARIFAS_BASE = {
  ASESORIA_INICIAL: 200000,
  ASESORIA_SEGUIMIENTO: 150000,
  ASESORIA_ESPECIALIZADA: 300000,
  REPRESENTACION_REORGANIZACION: 5000000,
  REPRESENTACION_LIQUIDACION: 4000000,
  REPRESENTACION_PERSONA_NATURAL: 2000000,
  TRAMITE_DERECHO_PETICION: 500000,
  TRAMITE_LEVANTAMIENTO_EMBARGO: 800000,
  GESTION_COBRANZA: 1000000,
  AUDIENCIA_CONCILIACION: 800000,
  AUDIENCIA_JUDICIAL: 1200000,
} as const

// Funciones de facturación
export function calculateSubtotal(items: BillingItem[]): number {
  return items.reduce((sum, item) => sum + item.valorTotal, 0)
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * taxRate
}

export function calculateTotal(subtotal: number, taxes: number): number {
  return subtotal + taxes
}

export async function generateFacturaNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  const prefix = `FAC-${currentYear}`
  
  const lastFactura = await prisma.factura.findFirst({
    where: {
      numero: {
        startsWith: prefix
      }
    },
    orderBy: {
      numero: 'desc'
    }
  })

  let nextNumber = 1
  if (lastFactura) {
    const lastNumber = parseInt(lastFactura.numero.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`
}

export async function createFactura(honorarioId: string, creadoPorId: string) {
  const honorario = await prisma.honorario.findUnique({
    where: { id: honorarioId },
    include: {
      caso: {
        include: {
          cliente: true
        }
      }
    }
  })

  if (!honorario) {
    throw new Error('Honorario no encontrado')
  }

  const subtotal = honorario.valor.toNumber()
  const iva = calculateTax(subtotal, TAX_CONFIG.IVA)
  const total = calculateTotal(subtotal, iva)
  
  const numero = await generateFacturaNumber()
  const fechaVencimiento = new Date()
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 30) // 30 días de vencimiento

  const factura = await prisma.factura.create({
    data: {
      numero,
      fechaVencimiento,
      subtotal: new Decimal(subtotal),
      impuestos: new Decimal(iva),
      total: new Decimal(total),
      honorarioId,
      creadoPorId,
      items: {
        create: [{
          descripcion: `Honorarios profesionales - ${honorario.tipo} - Caso: ${honorario.caso.numeroCaso}`,
          cantidad: 1,
          valorUnitario: new Decimal(honorario.valor),
          valorTotal: new Decimal(honorario.valor)
        }]
      }
    },
    include: {
      items: true,
      honorario: {
        include: {
          caso: {
            include: {
              cliente: true
            }
          }
        }
      }
    }
  })

  return factura
}

export async function createFacturaFromHonorario(honorarioId: string, creadoPorId: string) {
  return await createFactura(honorarioId, creadoPorId)
}

export async function createFacturaFromAsesoria(asesoriaId: string, creadoPorId: string) {
  const asesoria = await prisma.asesoria.findUnique({
    where: { id: asesoriaId },
    include: {
      lead: true
    }
  })

  if (!asesoria || !asesoria.valor) {
    throw new Error('Asesoría no encontrada o sin valor asignado')
  }

  // Crear cliente temporal si no existe
  let cliente = await prisma.cliente.findUnique({
    where: { email: asesoria.lead.email }
  })

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        nombre: asesoria.lead.nombre,
        email: asesoria.lead.email,
        telefono: asesoria.lead.telefono,
        documento: asesoria.lead.documento || `TEMP-${Date.now()}`,
        tipoPersona: asesoria.lead.tipoPersona,
        empresa: asesoria.lead.empresa
      }
    })
  }

  // Crear caso temporal para la asesoría
  const caso = await prisma.caso.create({
    data: {
      numeroCaso: `ASESORIA-${Date.now()}`,
      tipoInsolvencia: 'REORGANIZACION', // Default
      valorDeuda: asesoria.valor,
      clienteId: cliente.id,
      responsableId: asesoria.asesorId,
      creadoPorId: asesoria.asesorId,
      observaciones: `Caso creado para asesoría: ${asesoria.tema}`
    }
  })

  // Crear honorario para la asesoría
  const honorario = await prisma.honorario.create({
    data: {
      tipo: 'ASESORIA',
      modalidadPago: 'CONTADO',
      valor: asesoria.valor,
      casoId: caso.id
    }
  })

  return await createFactura(honorario.id, creadoPorId)
}

// Reportes de facturación
export async function getFacturacionReport(startDate: Date, endDate: Date) {
  const facturas = await prisma.factura.findMany({
    where: {
      fecha: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      items: true,
      pagos: true
    }
  })

  const totalFacturado = facturas.reduce((sum, f) => sum + f.total.toNumber(), 0)
  const totalPagado = facturas.reduce((sum, f) => 
    sum + f.pagos.reduce((pSum, p) => pSum + p.valor.toNumber(), 0), 0
  )
  const totalPendiente = totalFacturado - totalPagado

  const facturasPorEstado = {
    GENERADA: facturas.filter(f => f.estado === 'GENERADA').length,
    ENVIADA: facturas.filter(f => f.estado === 'ENVIADA').length,
    PAGADA: facturas.filter(f => f.estado === 'PAGADA').length,
    VENCIDA: facturas.filter(f => f.estado === 'VENCIDA').length,
    ANULADA: facturas.filter(f => f.estado === 'ANULADA').length,
  }

  return {
    totalFacturas: facturas.length,
    totalFacturado,
    totalPagado,
    totalPendiente,
    porcentajePagado: totalFacturado > 0 ? (totalPagado / totalFacturado) * 100 : 0,
    facturasPorEstado,
    facturas
  }
}

export async function updateFacturasVencidas(): Promise<void> {
  const now = new Date()
  
  await prisma.factura.updateMany({
    where: {
      fechaVencimiento: {
        lt: now
      },
      estado: {
        in: ['GENERADA', 'ENVIADA']
      }
    },
    data: {
      estado: 'VENCIDA'
    }
  })
}

// Cálculo de comisiones (si aplica)
export function calculateCommission(valor: number, percentage: number): number {
  return valor * (percentage / 100)
}

export async function getCarteraVencida() {
  const facturas = await prisma.factura.findMany({
    where: {
      estado: 'VENCIDA'
    },
    include: {
      pagos: true,
      honorario: {
        include: {
          caso: {
            include: {
              cliente: true
            }
          }
        }
      }
    }
  })

  return facturas.map(factura => {
    const totalPagado = factura.pagos.reduce((sum, p) => sum + p.valor.toNumber(), 0)
    const saldoPendiente = factura.total.toNumber() - totalPagado
    const diasVencimiento = Math.floor((new Date().getTime() - factura.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))

    return {
      ...factura,
      totalPagado,
      saldoPendiente,
      diasVencimiento,
      cliente: factura.honorario?.caso?.cliente
    }
  })
}
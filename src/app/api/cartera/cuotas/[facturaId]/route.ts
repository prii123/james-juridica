'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/cartera/cuotas/[facturaId] - Obtener cuotas con seguimiento de pagos
export async function GET(
  request: NextRequest,
  { params }: { params: { facturaId: string } }
) {
  try {
    const { facturaId } = params

    // Obtener información de la factura con cuotas y pagos
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        honorario: {
          include: {
            caso: {
              include: {
                cliente: true
              }
            }
          }
        },
        cuotasFactura: {
          include: {
            abonosPagos: {
              include: {
                pago: true
              }
            }
          },
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        pagos: {
          include: {
            aplicadoCuotas: {
              include: {
                cuota: true
              }
            }
          },
          orderBy: {
            fecha: 'desc'
          }
        }
      }
    })

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Procesar datos para el frontend
    const cuotasConSeguimiento = factura.cuotasFactura.map(cuota => {
      const totalPagado = cuota.abonosPagos.reduce((sum, abono) => 
        sum + Number(abono.valorAplicado), 0
      )
      
      const saldoCuota = Number(cuota.valor) - totalPagado
      
      // Determinar estado actual de la cuota
      let estado = cuota.estado
      if (totalPagado >= Number(cuota.valor)) {
        estado = 'PAGADA'
      } else if (totalPagado > 0) {
        estado = 'PARCIAL'
      } else if (new Date(cuota.fechaVencimiento) < new Date() && estado !== 'PAGADA') {
        estado = 'VENCIDA'
      }

      return {
        id: cuota.id,
        numeroCuota: cuota.numeroCuota,
        valor: Number(cuota.valor),
        capital: Number(cuota.capital),
        interes: Number(cuota.interes),
        saldo: Number(cuota.saldo),
        fechaVencimiento: cuota.fechaVencimiento.toISOString(),
        fechaPago: cuota.fechaPago?.toISOString(),
        estado: estado,
        observaciones: cuota.observaciones,
        valorPagado: totalPagado,
        saldoCuota: Math.max(0, saldoCuota),
        diasVencido: estado === 'VENCIDA' 
          ? Math.ceil((new Date().getTime() - new Date(cuota.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        pagosAplicados: cuota.abonosPagos.map(abono => ({
          id: abono.id,
          valorAplicado: Number(abono.valorAplicado),
          fechaAplicacion: abono.fechaAplicacion.toISOString(),
          observaciones: abono.observaciones,
          pago: {
            id: abono.pago.id,
            valor: Number(abono.pago.valor),
            fecha: abono.pago.fecha.toISOString(),
            metodoPago: abono.pago.metodoPago,
            referencia: abono.pago.referencia,
            observaciones: abono.pago.observaciones
          }
        }))
      }
    })

    // Calcular resumen general
    const totalFactura = Number(factura.total)
    const totalPagado = factura.pagos.reduce((sum, pago) => sum + Number(pago.valor), 0)
    const saldoPendiente = Math.max(0, totalFactura - totalPagado)
    
    const cuotasPagadas = cuotasConSeguimiento.filter(c => c.estado === 'PAGADA').length
    const cuotasVencidas = cuotasConSeguimiento.filter(c => c.estado === 'VENCIDA').length
    const cuotasParciales = cuotasConSeguimiento.filter(c => c.estado === 'PARCIAL').length

    const responseData = {
      factura: {
        id: factura.id,
        numero: factura.numero,
        fecha: factura.fecha.toISOString(),
        total: totalFactura,
        modalidadPago: factura.modalidadPago,
        numeroCuotas: factura.numeroCuotas,
        valorCuota: factura.valorCuota ? Number(factura.valorCuota) : null,
        tasaInteres: factura.tasaInteres ? Number(factura.tasaInteres) : null,
        cliente: {
          nombre: factura.honorario.caso.cliente.nombre,
          apellido: factura.honorario.caso.cliente.apellido
        },
        caso: {
          numeroCaso: factura.honorario.caso.numeroCaso
        }
      },
      resumen: {
        totalPagado,
        saldoPendiente,
        cuotasPagadas,
        cuotasVencidas,
        cuotasParciales,
        cuotasPendientes: cuotasConSeguimiento.length - cuotasPagadas - cuotasVencidas - cuotasParciales,
        progresoPago: totalFactura > 0 ? (totalPagado / totalFactura) * 100 : 0
      },
      cuotas: cuotasConSeguimiento,
      historialPagos: factura.pagos.map(pago => ({
        id: pago.id,
        valor: Number(pago.valor),
        fecha: pago.fecha.toISOString(),
        metodoPago: pago.metodoPago,
        referencia: pago.referencia,
        observaciones: pago.observaciones,
        distribucion: pago.aplicadoCuotas.map(aplicacion => ({
          cuotaNumero: aplicacion.cuota.numeroCuota,
          valorAplicado: Number(aplicacion.valorAplicado),
          fechaAplicacion: aplicacion.fechaAplicacion.toISOString()
        }))
      }))
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error al obtener cuotas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
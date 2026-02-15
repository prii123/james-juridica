'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/cartera/aplicar-pago - Aplicar pago a cuotas específicas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      facturaId,
      valor,
      metodoPago,
      referencia,
      observaciones,
      distribucionCuotas, // Array de { cuotaId, valorAplicado }
      aplicacionAutomatica = false
    } = body

    // Validaciones básicas
    if (!facturaId || !valor || !metodoPago) {
      return NextResponse.json(
        { error: 'Datos requeridos: facturaId, valor, metodoPago' },
        { status: 400 }
      )
    }

    if (valor <= 0) {
      return NextResponse.json(
        { error: 'El valor del pago debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Verificar que la factura existe y tiene cuotas
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        cuotasFactura: {
          include: {
            abonosPagos: true
          },
          orderBy: {
            numeroCuota: 'asc'
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

    if (!factura.cuotasFactura || factura.cuotasFactura.length === 0) {
      return NextResponse.json(
        { error: 'Esta factura no tiene cuotas configuradas' },
        { status: 400 }
      )
    }

    let distribucionFinal: Array<{ cuotaId: string, valorAplicado: number }> = []

    if (aplicacionAutomatica) {
      // Aplicación automática: distribución cronológica priorizando vencidas
      let montoRestante = valor
      
      // Ordenar cuotas: vencidas primero, luego por fecha de vencimiento
      const cuotasOrdenadas = factura.cuotasFactura
        .map(cuota => {
          const totalPagado = cuota.abonosPagos.reduce((sum, abono) => 
            sum + Number(abono.valorAplicado), 0
          )
          const saldoCuota = Number(cuota.valor) - totalPagado
          const estaVencida = new Date(cuota.fechaVencimiento) < new Date()
          
          return {
            ...cuota,
            saldoCuota: Math.max(0, saldoCuota),
            estaVencida
          }
        })
        .filter(cuota => cuota.saldoCuota > 0) // Solo cuotas con saldo pendiente
        .sort((a, b) => {
          // Primero las vencidas
          if (a.estaVencida && !b.estaVencida) return -1
          if (!a.estaVencida && b.estaVencida) return 1
          
          // Luego por fecha de vencimiento
          return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
        })

      for (const cuota of cuotasOrdenadas) {
        if (montoRestante <= 0) break
        
        const montoAplicar = Math.min(montoRestante, cuota.saldoCuota)
        if (montoAplicar > 0) {
          distribucionFinal.push({
            cuotaId: cuota.id,
            valorAplicado: montoAplicar
          })
          montoRestante -= montoAplicar
        }
      }

    } else {
      // Aplicación manual: usar la distribución especificada
      if (!distribucionCuotas || distribucionCuotas.length === 0) {
        return NextResponse.json(
          { error: 'Debe especificar la distribución de cuotas o activar aplicación automática' },
          { status: 400 }
        )
      }

      // Verificar que la suma de la distribución coincide con el valor del pago
      const totalDistribucion = distribucionCuotas.reduce((sum: number, item: any) => 
        sum + Number(item.valorAplicado), 0
      )

      if (Math.abs(totalDistribucion - valor) > 0.01) { // Tolerancia de 1 centavo
        return NextResponse.json(
          { error: `La suma de la distribución (${totalDistribucion}) no coincide con el valor del pago (${valor})` },
          { status: 400 }
        )
      }

      // Verificar que las cuotas existen y tienen saldo suficiente
      for (const item of distribucionCuotas) {
        const cuota = factura.cuotasFactura.find(c => c.id === item.cuotaId)
        if (!cuota) {
          return NextResponse.json(
            { error: `Cuota ${item.cuotaId} no encontrada` },
            { status: 400 }
          )
        }

        const totalPagado = cuota.abonosPagos.reduce((sum, abono) => 
          sum + Number(abono.valorAplicado), 0
        )
        const saldoCuota = Number(cuota.valor) - totalPagado

        if (item.valorAplicado > saldoCuota) {
          return NextResponse.json(
            { error: `El valor aplicado a la cuota ${cuota.numeroCuota} (${item.valorAplicado}) es mayor al saldo disponible (${saldoCuota})` },
            { status: 400 }
          )
        }
      }

      distribucionFinal = distribucionCuotas
    }

    if (distribucionFinal.length === 0) {
      return NextResponse.json(
        { error: 'No hay cuotas pendientes para aplicar el pago' },
        { status: 400 }
      )
    }

    // Ejecutar la transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el pago
      const pago = await tx.pago.create({
        data: {
          valor,
          metodoPago,
          referencia,
          observaciones,
          facturaId
        }
      })

      // Aplicar el pago a las cuotas
      const aplicaciones = []
      for (const item of distribucionFinal) {
        const aplicacion = await tx.pagoCuota.create({
          data: {
            pagoId: pago.id,
            cuotaId: item.cuotaId,
            valorAplicado: item.valorAplicado,
            observaciones: aplicacionAutomatica ? 'Aplicación automática' : 'Aplicación manual'
          }
        })
        aplicaciones.push(aplicacion)

        // Actualizar el estado de la cuota si es necesario
        const cuota = await tx.cuotaFactura.findUnique({
          where: { id: item.cuotaId },
          include: { abonosPagos: true }
        })

        if (cuota) {
          const totalPagado = cuota.abonosPagos.reduce((sum, abono) => 
            sum + Number(abono.valorAplicado), 0
          ) + item.valorAplicado

          const saldoCuota = Number(cuota.valor) - totalPagado
          
          let nuevoEstado = cuota.estado
          if (totalPagado >= Number(cuota.valor)) {
            nuevoEstado = 'PAGADA'
          } else if (totalPagado > 0) {
            nuevoEstado = 'PARCIAL'
          }

          await tx.cuotaFactura.update({
            where: { id: item.cuotaId },
            data: {
              estado: nuevoEstado as any,
              fechaPago: nuevoEstado === 'PAGADA' ? new Date() : null,
              valorPagado: totalPagado,
              saldoCuota: Math.max(0, saldoCuota)
            }
          })
        }
      }

      return { pago, aplicaciones }
    })

    return NextResponse.json({
      success: true,
      message: 'Pago aplicado exitosamente',
      pago: {
        id: resultado.pago.id,
        valor: Number(resultado.pago.valor),
        fecha: resultado.pago.fecha.toISOString(),
        metodoPago: resultado.pago.metodoPago,
        referencia: resultado.pago.referencia
      },
      aplicaciones: resultado.aplicaciones.map(app => ({
        cuotaId: app.cuotaId,
        valorAplicado: Number(app.valorAplicado)
      })),
      distribucionUtilizada: distribucionFinal
    })

  } catch (error) {
    console.error('Error al aplicar pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
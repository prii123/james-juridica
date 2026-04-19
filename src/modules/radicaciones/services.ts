/**
 * Servicios de Radicaciones - Lógica de negocio
 */

import { prisma } from '@/lib/db'
import { CrearRadicacionInput, ActualizarRadicacionInput, FiltrosRadicacion } from './types'
import { RadicacionRepository } from './repository'
import {
  RadicacionNoEncontradaError,
  AsesoriaNoEncontradaError,
  RadicacionDuplicadaError,
  mapearRadicacionParaRespuesta,
  generarNumeroRadicacion,
  validarCambioEstado,
  calcularValorHonorario,
  calcularIVA,
  generarNumeroCaso,
  generarNumeroFactura,
} from './models'
import { BusinessError } from '@/lib/api-errors'

export class RadicacionService {
  private repository: RadicacionRepository

  constructor() {
    this.repository = new RadicacionRepository()
  }

  /**
   * Crea una nueva radicación con validaciones
   */
  async crearRadicacion(datos: CrearRadicacionInput) {
    // Validar que la asesoría existe
    const asesoria = await prisma.asesoria.findUnique({
      where: { id: datos.asesoriaId },
    })

    if (!asesoria) {
      throw new AsesoriaNoEncontradaError(datos.asesoriaId)
    }

    // Generar número si es necesario
    let numero = datos.numero
    if (!numero || numero.includes('TEMP')) {
      const ultimoEnAno = await this.repository.obtenerUltimoPorAno(
        new Date().getFullYear()
      )
      numero = await generarNumeroRadicacion(ultimoEnAno?.numero)
    } else {
      // Verificar que el número sea único
      const existe = await this.repository.existeNumero(numero)
      if (existe) {
        throw new RadicacionDuplicadaError(numero)
      }
    }

    // Crear radicación
    const radicacion = await this.repository.crear({
      ...datos,
      numero,
    })

    return mapearRadicacionParaRespuesta(radicacion)
  }

  /**
   * Obtiene una radicación por ID
   */
  async obtenerRadicacionPorId(id: string) {
    const radicacion = await this.repository.obtenerPorId(id)

    if (!radicacion) {
      throw new RadicacionNoEncontradaError(id)
    }

    return mapearRadicacionParaRespuesta(radicacion)
  }

  /**
   * Obtiene radicaciones con filtros y paginación
   */
  async obtenerRadicacionesPaginadas(
    filtros: FiltrosRadicacion,
    page: number,
    limit: number
  ) {
    const resultado = await this.repository.obtenerPorFiltros(
      filtros,
      page,
      limit
    )

    return {
      radicaciones: resultado.radicaciones.map(mapearRadicacionParaRespuesta),
      pagination: {
        total: resultado.total,
        pages: resultado.totalPages,
        currentPage: resultado.page,
        limit: resultado.limit,
      },
    }
  }

  /**
   * Actualiza una radicación
   */
  async actualizarRadicacion(id: string, datos: ActualizarRadicacionInput) {
    // Verificar que existe
    const existente = await this.repository.obtenerPorId(id)
    if (!existente) {
      throw new RadicacionNoEncontradaError(id)
    }

    // Validar cambio de estado si es necesario
    if (datos.estado && existente.estado !== datos.estado) {
      const esValido = validarCambioEstado(
        existente.estado as any,
        datos.estado
      )
      if (!esValido) {
        throw new BusinessError(
          `No se puede transicionar de ${existente.estado} a ${datos.estado}`,
          'TRANSICION_ESTADO_INVALIDA'
        )
      }
    }

    // Actualizar
    const actualizada = await this.repository.actualizar(id, datos)
    return mapearRadicacionParaRespuesta(actualizada)
  }

  /**
   * Actualiza radicación y crea caso/honorario/factura si es necesario
   */
  async actualizarRadicacionConCaso(
    id: string,
    datos: ActualizarRadicacionInput,
    createCase: boolean
  ) {
    // Verificar que existe
    const existente = await this.repository.obtenerPorId(id)
    if (!existente) {
      throw new RadicacionNoEncontradaError(id)
    }

    // Validar cambio de estado
    if (datos.estado && existente.estado !== datos.estado) {
      const esValido = validarCambioEstado(
        existente.estado as any,
        datos.estado
      )
      if (!esValido) {
        throw new BusinessError(
          `No se puede transicionar de ${existente.estado} a ${datos.estado}`,
          'TRANSICION_ESTADO_INVALIDA'
        )
      }
    }

    let casoCreado = null
    let honorarioCreado = null
    let facturaCreada = null

    // Si se está aceptando (REALIZADA) y se solicita crear caso
    if (
      createCase &&
      datos.estado === 'REALIZADA' &&
      existente.estado !== 'REALIZADA'
    ) {
      // Obtener asesoría con lead
      const asesoriaConLead = await prisma.asesoria.findUnique({
        where: { id: existente.asesoriaId },
        include: {
          lead: true,
          asesor: true,
        },
      })

      if (!asesoriaConLead?.lead) {
        throw new BusinessError(
          'No se puede crear caso sin información del lead',
          'LEAD_NO_ENCONTRADO'
        )
      }

      const leadData = asesoriaConLead.lead

      // Buscar o crear cliente
      let cliente = await prisma.cliente.findUnique({
        where: { email: leadData.email },
      })

      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            nombre: leadData.nombre,
            email: leadData.email,
            telefono: leadData.telefono || '',
            documento: (leadData as any).documento || `TEMP-${Date.now()}`,
            tipoPersona: 'NATURAL',
          },
        })
      }

      // Buscar caso existente
      const casoExistente = await prisma.caso.findFirst({
        where: {
          clienteId: cliente.id,
          tipoInsolvencia: 'LIQUIDACION_JUDICIAL',
          estado: 'ACTIVO',
        },
      })

      if (casoExistente) {
        // Actualizar caso existente
        casoCreado = await prisma.caso.update({
          where: { id: casoExistente.id },
          data: {
            observaciones: `${casoExistente.observaciones}\n\nRadicación adicional aceptada: ${existente.numero} - ${existente.demandante} vs ${existente.demandado} por ${existente.valor}`,
            updatedAt: new Date(),
          },
        })
      } else {
        // Crear nuevo caso
        const numeroCaso = generarNumeroCaso()
        casoCreado = await prisma.caso.create({
          data: {
            numeroCaso,
            tipoInsolvencia: 'LIQUIDACION_JUDICIAL',
            estado: 'ACTIVO',
            prioridad: 'MEDIA',
            fechaInicio: new Date(),
            observaciones: `Caso creado automáticamente al aceptar radicación ${existente.numero}. Demandante: ${existente.demandante} vs ${existente.demandado}`,
            clienteId: cliente.id,
            responsableId: asesoriaConLead.asesorId || '',
            creadoPorId: asesoriaConLead.asesorId || '',
          },
        })
      }

      // Crear honorario (15% del valor)
      const valorHonorario = calcularValorHonorario(Number(existente.valor))

      honorarioCreado = await prisma.honorario.create({
        data: {
          tipo: 'REPRESENTACION',
          modalidadPago: 'CONTADO',
          valor: valorHonorario,
          estado: 'PENDIENTE',
          fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          observaciones: `Honorario generado automáticamente por aceptación de radicación ${existente.numero}`,
          casoId: casoCreado.id,
        },
      })

      // Crear factura
      const numeroFactura = generarNumeroFactura()
      const impuestos = calcularIVA(valorHonorario)
      const total = valorHonorario + impuestos

      facturaCreada = await prisma.factura.create({
        data: {
          numero: numeroFactura,
          fecha: new Date(),
          fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotal: valorHonorario,
          impuestos: impuestos,
          total: total,
          estado: 'GENERADA',
          observaciones: `Factura generada automáticamente por caso ${casoCreado.numeroCaso} - Radicación aceptada`,
          ivaActivado: true,
          honorarioId: honorarioCreado.id,
          creadoPorId: asesoriaConLead.asesorId || '',
          items: {
            create: [
              {
                descripcion: `Honorarios profesionales - Representación en proceso de insolvencia - Caso ${casoCreado.numeroCaso}`,
                cantidad: 1,
                valorUnitario: valorHonorario,
                valorTotal: valorHonorario,
              },
            ],
          },
        },
      })
    }

    // Actualizar radicación
    const actualizada = await this.repository.actualizar(id, datos)

    return {
      radicacion: mapearRadicacionParaRespuesta(actualizada),
      casoCreado,
      honorarioCreado,
      facturaCreada,
    }
  }

  /**
   * Elimina una radicación
   */
  async eliminarRadicacion(id: string) {
    // Verificar que existe
    const existente = await this.repository.obtenerPorId(id)
    if (!existente) {
      throw new RadicacionNoEncontradaError(id)
    }

    await this.repository.eliminar(id)
  }
}

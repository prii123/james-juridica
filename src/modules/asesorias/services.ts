/**
 * Servicios de Asesorías
 * Capa de lógica de negocio
 */

import { AsesoriaRepository } from './repository'
import { CrearAsesoriaInput, ActualizarAsesoriaInput, FiltrosAsesoria } from './types'
import { crearAsesoriaValidator, actualizarAsesoriaValidator } from './validators'
import {
  AsesoriaNoEncontradaError,
  AsesoriaBusinessError,
  mapearAsesoriaParaRespuesta,
  validarCambioEstado,
  validarPuedeRealizarAsesoria,
  validarPuedeCancelarAsesoria,
  validarPuedeReprogramarAsesoria,
  calcularTazaExito,
} from './models'

export class AsesoriaService {
  private repository: AsesoriaRepository

  constructor() {
    this.repository = new AsesoriaRepository()
  }

  /**
   * Crea una nueva asesoría
   */
  async crearAsesoria(datos: CrearAsesoriaInput) {
    // Validar datos
    const datosValidados = crearAsesoriaValidator.parse(datos)

    // TODO: Validar que el lead existe
    // const lead = await leadRepository.obtenerPorId(datosValidados.leadId)
    // if (!lead) throw new LeadNoEncontradoError()

    // TODO: Validar que el abogado existe
    // const abogado = await usuarioRepository.obtenerPorId(datosValidados.abogadoId)
    // if (!abogado) throw new AbogadoNoEncontradoError()

    const asesorias = await this.repository.crear(datosValidados)
    return mapearAsesoriaParaRespuesta(asesorias)
  }

  /**
   * Obtiene una asesoría por ID
   */
  async obtenerAsesoria(id: string) {
    const asesorias = await this.repository.obtenerPorId(id)
    if (!asesorias) {
      throw new AsesoriaNoEncontradaError(id)
    }
    return mapearAsesoriaParaRespuesta(asesorias)
  }

  /**
   * Actualiza una asesoría
   */
  async actualizarAsesoria(id: string, datos: ActualizarAsesoriaInput) {
    // Verificar que existe
    const asesorias = await this.repository.obtenerPorId(id)
    if (!asesorias) {
      throw new AsesoriaNoEncontradaError(id)
    }

    // Validar datos
    const datosValidados = actualizarAsesoriaValidator.parse(datos)

    // Validar transición de estado si se intenta cambiar
    if (datosValidados.estado && datosValidados.estado !== asesorias.estado) {
      if (!validarCambioEstado(asesorias.estado, datosValidados.estado)) {
        throw new AsesoriaBusinessError(
          `No se puede cambiar de ${asesorias.estado} a ${datosValidados.estado}`,
          'CAMBIO_ESTADO_INVALIDO'
        )
      }
    }

    const actualizada = await this.repository.actualizar(id, datosValidados)
    return mapearAsesoriaParaRespuesta(actualizada)
  }

  /**
   * Realiza una asesoría
   */
  async realizarAsesoria(id: string, resultado: any) {
    const asesorias = await this.repository.obtenerPorId(id)
    if (!asesorias) {
      throw new AsesoriaNoEncontradaError(id)
    }

    validarPuedeRealizarAsesoria(asesorias)

    const actualizada = await this.repository.actualizar(id, {
      estado: 'REALIZADA',
      resultado,
    })

    return mapearAsesoriaParaRespuesta(actualizada)
  }

  /**
   * Cancela una asesoría
   */
  async cancelarAsesoria(id: string) {
    const asesorias = await this.repository.obtenerPorId(id)
    if (!asesorias) {
      throw new AsesoriaNoEncontradaError(id)
    }

    validarPuedeCancelarAsesoria(asesorias)

    const cancelada = await this.repository.actualizar(id, {
      estado: 'CANCELADA',
    })

    return mapearAsesoriaParaRespuesta(cancelada)
  }

  /**
   * Reprograma una asesoría
   */
  async reprogramarAsesoria(id: string, nuevaFecha: Date) {
    const asesorias = await this.repository.obtenerPorId(id)
    if (!asesorias) {
      throw new AsesoriaNoEncontradaError(id)
    }

    validarPuedeReprogramarAsesoria(asesorias)

    const reprogramada = await this.repository.actualizar(id, {
      estado: 'REPROGRAMADA',
      fechaProgramada: nuevaFecha,
    })

    return mapearAsesoriaParaRespuesta(reprogramada)
  }

  /**
   * Obtiene asesorías con filtros
   */
  async obtenerAsesorias(
    filtros: FiltrosAsesoria = {},
    pagina: number = 1,
    limite: number = 10,
  ) {
    const resultado = await this.repository.obtenerPorFiltros(filtros, pagina, limite)

    return {
      asesorias: resultado.asesorias.map(mapearAsesoriaParaRespuesta),
      total: resultado.total,
      pagina: resultado.pagina,
      limite: resultado.limite,
      totalPaginas: resultado.totalPaginas,
    }
  }

  /**
   * Obtiene asesorías próximas
   */
  async obtenerAsesoriasPróximas(diasDesdeAhora: number = 3) {
    const asesorias = await this.repository.obtenerPróximas(diasDesdeAhora)
    return asesorias.map(mapearAsesoriaParaRespuesta)
  }

  /**
   * Obtiene asesorías vencidas
   */
  async obtenerAsesoriasVencidas() {
    const asesorias = await this.repository.obtenerVencidas()
    return asesorias.map(mapearAsesoriaParaRespuesta)
  }

  /**
   * Obtiene estadísticas de asesorías
   */
  async obtenerEstadisticas(desde?: Date, hasta?: Date) {
    return await this.repository.obtenerEstadisticas(desde, hasta)
  }

  /**
   * Obtiene asesorías de un abogado
   */
  async obtenerAsesoriasAbogado(abogadoId: string, soloPendientes: boolean = false) {
    const asesorias = await this.repository.obtenerPorAbogado(abogadoId, soloPendientes)
    return asesorias.map(mapearAsesoriaParaRespuesta)
  }

  /**
   * Obtiene asesorías de un lead
   */
  async obtenerAsesoriasLead(leadId: string) {
    const asesorias = await this.repository.obtenerPorLead(leadId)
    return asesorias.map(mapearAsesoriaParaRespuesta)
  }

  /**
   * Elimina una asesoría
   */
  async eliminarAsesoria(id: string) {
    const asesorias = await this.repository.obtenerPorId(id)
    if (!asesorias) {
      throw new AsesoriaNoEncontradaError(id)
    }

    // Solo se pueden eliminar asesorías canceladas o no realizadas muy recientes
    if (asesorias.estado === 'REALIZADA') {
      throw new AsesoriaBusinessError(
        'No se puede eliminar una asesoría que ya fue realizada',
        'ASESORIAS_YA_REALIZADA'
      )
    }

    await this.repository.eliminar(id)
  }

  /**
   * Busca asesorías
   */
  async buscarAsesorias(query: string, limite: number = 10) {
    const asesorias = await this.repository.buscar(query, limite)
    return asesorias.map(mapearAsesoriaParaRespuesta)
  }
}

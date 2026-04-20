import { ProcesosLiquidacionRepository } from './repository'
import { CreateProcesoLiquidacionData, UpdateProcesoLiquidacionData, ProcesoLiquidacionFilters } from './types'
import { createProcesoLiquidacionSchema, updateProcesoLiquidacionSchema, CreateProcesoLiquidacionSchemaType, UpdateProcesoLiquidacionSchemaType } from './validators'

export class ProcesosLiquidacionService {
    private repository: ProcesosLiquidacionRepository

    constructor() {
        this.repository = new ProcesosLiquidacionRepository()
    }

    async createProcesoLiquidacion(data: unknown) {
        // Validar datos de entrada
        const validatedData: CreateProcesoLiquidacionSchemaType = createProcesoLiquidacionSchema.parse(data)

        // Verificar si ya existe un proceso para esta audiencia
        const procesoExistente = await this.repository.findByAudienciaId(validatedData.audienciaId)
        if (procesoExistente) {
            throw new Error('Ya existe un proceso de liquidación para esta audiencia')
        }

        // Crear el proceso de liquidación
        return await this.repository.create(validatedData as CreateProcesoLiquidacionData)
    }

    async updateProcesoLiquidacion(id: string, data: unknown) {
        // Verificar que el proceso existe
        const existingProceso = await this.repository.findById(id)
        if (!existingProceso) {
            throw new Error('Proceso de liquidación no encontrado')
        }

        // Validar datos de entrada
        const validatedData: UpdateProcesoLiquidacionSchemaType = updateProcesoLiquidacionSchema.parse(data)

        // Actualizar el proceso
        return await this.repository.update(id, validatedData as UpdateProcesoLiquidacionData)
    }

    async getProcesoLiquidacionById(id: string) {
        const proceso = await this.repository.findById(id)

        if (!proceso) {
            throw new Error('Proceso de liquidación no encontrado')
        }

        return proceso
    }

    async getProcesoLiquidacionByAudiencia(audienciaId: string) {
        return await this.repository.findByAudienciaId(audienciaId)
    }

    async getProcesosLiquidacionByCaso(casoId: string) {
        return await this.repository.findByCaso(casoId)
    }

    async updatePasoLiquidacion(id: string, pasoId: string, completado: boolean) {
        const proceso = await this.repository.findById(id)
        if (!proceso) {
            throw new Error('Proceso de liquidación no encontrado')
        }

        return await this.repository.updatePaso(id, pasoId, completado)
    }

    async deleteProcesoLiquidacion(id: string) {
        // Verificar que el proceso existe
        const existingProceso = await this.repository.findById(id)
        if (!existingProceso) {
            throw new Error('Proceso de liquidación no encontrado')
        }

        return await this.repository.delete(id)
    }
}

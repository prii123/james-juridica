import { AudienciasRepository } from './repository'
import { CreateAudienciaData, UpdateAudienciaData, AudienciaFilters } from './types'
import { createAudienciaSchema, updateAudienciaSchema, CreateAudienciaSchemaType, UpdateAudienciaSchemaType } from './validators'

export class AudienciasService {
    private repository: AudienciasRepository

    constructor() {
        this.repository = new AudienciasRepository()
    }

    async createAudiencia(data: unknown) {
        // Validar datos de entrada
        const validatedData: CreateAudienciaSchemaType = createAudienciaSchema.parse(data)

        // Crear la audiencia
        return await this.repository.create(validatedData as CreateAudienciaData)
    }

    async updateAudiencia(id: string, data: unknown) {
        // Verificar que la audiencia existe
        const existingAudiencia = await this.repository.findById(id)
        if (!existingAudiencia) {
            throw new Error('Audiencia no encontrada')
        }

        // Validar datos de entrada
        const validatedData: UpdateAudienciaSchemaType = updateAudienciaSchema.parse(data)

        // Actualizar la audiencia
        return await this.repository.update(id, validatedData as UpdateAudienciaData)
    }

    async getAudienciaById(id: string) {
        const audiencia = await this.repository.findById(id)

        if (!audiencia) {
            throw new Error('Audiencia no encontrada')
        }

        return audiencia
    }

    async getAudienciasByCaso(casoId: string, filters?: AudienciaFilters) {
        return await this.repository.findByCaso(casoId, filters)
    }

    async getAudiencias(filters?: AudienciaFilters, page: number = 1, limit: number = 10) {
        return await this.repository.findAll(filters, page, limit)
    }

    async deleteAudiencia(id: string) {
        // Verificar que la audiencia existe
        const existingAudiencia = await this.repository.findById(id)
        if (!existingAudiencia) {
            throw new Error('Audiencia no encontrada')
        }

        // Eliminar la audiencia
        return await this.repository.delete(id)
    }

    async getAudienciasProximas(dias: number = 7) {
        return await this.repository.getProximas(dias)
    }
}

import { prisma } from '@/lib/db'
import { CreateProcesoLiquidacionData, UpdateProcesoLiquidacionData, ProcesoLiquidacionWithRelations, PasoLiquidacion } from './types'
import { PASOS_LIQUIDACION_DEFAULT } from './types'
import { Prisma } from '@prisma/client'

export class ProcesosLiquidacionRepository {
    async create(data: CreateProcesoLiquidacionData) {
        const pasos = data.pasos || PASOS_LIQUIDACION_DEFAULT

        return await prisma.procesoLiquidacion.create({
            data: {
                audienciaId: data.audienciaId,
                casoId: data.casoId,
                pasos: pasos as unknown as Prisma.InputJsonValue
            }
        })
    }

    async findById(id: string): Promise<ProcesoLiquidacionWithRelations | null> {
        const proceso = await prisma.procesoLiquidacion.findUnique({
            where: { id }
        })

        return proceso as ProcesoLiquidacionWithRelations | null
    }

    async findByAudienciaId(audienciaId: string): Promise<ProcesoLiquidacionWithRelations | null> {
        const proceso = await prisma.procesoLiquidacion.findUnique({
            where: { audienciaId }
        })

        return proceso as ProcesoLiquidacionWithRelations | null
    }

    async findByCaso(casoId: string) {
        return await prisma.procesoLiquidacion.findMany({
            where: { casoId },
            orderBy: {
                createdAt: 'desc'
            }
        })
    }

    async update(id: string, data: UpdateProcesoLiquidacionData) {
        return await prisma.procesoLiquidacion.update({
            where: { id },
            data: {
                pasos: data.pasos as unknown as Prisma.InputJsonValue
            }
        })
    }

    async updatePaso(id: string, pasoId: string, completado: boolean) {
        const proceso = await this.findById(id)
        if (!proceso) {
            throw new Error('Proceso de liquidación no encontrado')
        }

        const pasos = (proceso.pasos as PasoLiquidacion[]).map(paso => {
            if (paso.id === pasoId) {
                return { ...paso, completado }
            }
            return paso
        })

        return await this.update(id, { pasos } as unknown as UpdateProcesoLiquidacionData)
    }

    async delete(id: string) {
        return await prisma.procesoLiquidacion.delete({
            where: { id }
        })
    }
}

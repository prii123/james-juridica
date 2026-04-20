import { prisma } from '@/lib/db'
import { CreateUsuarioData, UpdateUsuarioData, UsuarioFilters, UsuarioWithRole } from './types'

export class UsuariosRepository {
    async findAll(filters: UsuarioFilters = {}): Promise<UsuarioWithRole[]> {
        let whereClause: any = { activo: true }

        // Filtro por rol usando el nombre del rol
        if (filters.role === 'ASESOR' || filters.role === 'Asesor') {
            whereClause.role = {
                nombre: 'Asesor'
            }
        }

        // Filtro por roleId
        if (filters.roleId) {
            whereClause.roleId = filters.roleId
        }

        return await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                documento: true,
                activo: true,
                role: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true
                    }
                },
                createdAt: true,
                updatedAt: true
            },
            orderBy: [
                { nombre: 'asc' },
                { apellido: 'asc' }
            ]
        })
    }

    async findById(id: string): Promise<UsuarioWithRole | null> {
        return await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                documento: true,
                activo: true,
                role: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        })
    }

    async findByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email }
        })
    }

    async findByDocumento(documento: string) {
        return await prisma.user.findUnique({
            where: { documento }
        })
    }

    async create(data: CreateUsuarioData & { password: string }) {
        return await prisma.user.create({
            data: {
                nombre: data.nombre,
                apellido: data.apellido,
                email: data.email,
                password: data.password,
                telefono: data.telefono || null,
                documento: data.documento || null,
                roleId: data.roleId,
                activo: data.activo ?? true
            },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                documento: true,
                activo: true,
                role: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true
                    }
                },
                createdAt: true
            }
        })
    }

    async update(id: string, data: UpdateUsuarioData) {
        const updateData: any = {}

        if (data.nombre !== undefined) updateData.nombre = data.nombre
        if (data.apellido !== undefined) updateData.apellido = data.apellido
        if (data.email !== undefined) updateData.email = data.email
        if (data.password !== undefined) updateData.password = data.password
        if (data.telefono !== undefined) updateData.telefono = data.telefono
        if (data.documento !== undefined) updateData.documento = data.documento
        if (data.roleId !== undefined) updateData.roleId = data.roleId
        if (data.activo !== undefined) updateData.activo = data.activo

        return await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                documento: true,
                activo: true,
                role: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        })
    }

    async delete(id: string) {
        return await prisma.user.update({
            where: { id },
            data: { activo: false },
            select: {
                id: true
            }
        })
    }
}

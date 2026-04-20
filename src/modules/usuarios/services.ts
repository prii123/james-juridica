import bcrypt from 'bcryptjs'
import { UsuariosRepository } from './repository'
import { CreateUsuarioData, UpdateUsuarioData, UsuarioFilters } from './types'
import { createUsuarioSchema, updateUsuarioSchema } from './validators'

export class UsuariosService {
    private repository: UsuariosRepository

    constructor() {
        this.repository = new UsuariosRepository()
    }

    async getAllUsuarios(filters: UsuarioFilters = {}) {
        return await this.repository.findAll(filters)
    }

    async getUsuarioById(id: string) {
        const usuario = await this.repository.findById(id)
        if (!usuario) {
            throw new Error('Usuario no encontrado')
        }
        return usuario
    }

    async createUsuario(data: CreateUsuarioData) {
        // Validar datos de entrada
        const validatedData = createUsuarioSchema.parse(data)

        // Verificar que el email no existe
        const existingEmail = await this.repository.findByEmail(validatedData.email)
        if (existingEmail) {
            throw new Error('Ya existe un usuario con este email')
        }

        // Verificar que el documento no existe (si se proporciona)
        if (validatedData.documento) {
            const existingDocument = await this.repository.findByDocumento(validatedData.documento)
            if (existingDocument) {
                throw new Error('Ya existe un usuario con este documento')
            }
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(validatedData.password, 12)

        // Crear usuario
        return await this.repository.create({
            ...validatedData,
            password: hashedPassword
        })
    }

    async updateUsuario(id: string, data: UpdateUsuarioData) {
        // Verificar que el usuario existe
        const existingUsuario = await this.repository.findById(id)
        if (!existingUsuario) {
            throw new Error('Usuario no encontrado')
        }

        // Validar datos de entrada
        const validatedData = updateUsuarioSchema.parse(data)

        // Si se actualiza el email, verificar que no exista otro con ese email
        if (validatedData.email && validatedData.email !== existingUsuario.email) {
            const existingEmail = await this.repository.findByEmail(validatedData.email)
            if (existingEmail) {
                throw new Error('Ya existe un usuario con este email')
            }
        }

        // Si se actualiza el documento, verificar que no exista otro con ese documento
        if (validatedData.documento && validatedData.documento !== existingUsuario.documento) {
            const existingDocument = await this.repository.findByDocumento(validatedData.documento)
            if (existingDocument) {
                throw new Error('Ya existe un usuario con este documento')
            }
        }

        // Hash de la contraseña si se proporciona
        if (validatedData.password) {
            validatedData.password = await bcrypt.hash(validatedData.password, 12)
        }

        return await this.repository.update(id, validatedData)
    }

    async deleteUsuario(id: string) {
        // Verificar que el usuario existe
        const existingUsuario = await this.repository.findById(id)
        if (!existingUsuario) {
            throw new Error('Usuario no encontrado')
        }

        return await this.repository.delete(id)
    }
}

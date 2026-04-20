export interface CreateUsuarioData {
    nombre: string
    apellido: string
    email: string
    password: string
    telefono?: string | null
    documento?: string | null
    roleId: string
    activo?: boolean
}

export interface UpdateUsuarioData {
    nombre?: string
    apellido?: string
    email?: string
    password?: string
    telefono?: string | null
    documento?: string | null
    roleId?: string
    activo?: boolean
}

export interface UsuarioFilters {
    role?: string
    roleId?: string
    activo?: boolean
}

export interface UsuarioWithRole {
    id: string
    nombre: string
    apellido: string
    email: string
    telefono?: string | null
    documento?: string | null
    activo: boolean
    role: {
        id: string
        nombre: string
        descripcion: string | null
    }
    createdAt?: Date
    updatedAt?: Date
}

export interface UsuarioResponse {
    id: string
    nombre: string
    apellido: string
    email: string
    telefono?: string | null
    documento?: string | null
    activo: boolean
    role: {
        id: string
        nombre: string
    }
}

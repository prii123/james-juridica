import { z } from 'zod'

export const createUsuarioSchema = z.object({
    nombre: z.string()
        .min(1, 'El nombre es obligatorio')
        .max(100, 'El nombre no puede exceder 100 caracteres'),

    apellido: z.string()
        .min(1, 'El apellido es obligatorio')
        .max(100, 'El apellido no puede exceder 100 caracteres'),

    email: z.string()
        .email('Email inválido')
        .toLowerCase(),

    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),

    telefono: z.string()
        .optional()
        .nullable(),

    documento: z.string()
        .optional()
        .nullable(),

    roleId: z.string()
        .cuid('ID de rol inválido'),

    activo: z.boolean().default(true).optional()
})

export const updateUsuarioSchema = z.object({
    nombre: z.string()
        .min(1, 'El nombre es obligatorio')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .optional(),

    apellido: z.string()
        .min(1, 'El apellido es obligatorio')
        .max(100, 'El apellido no puede exceder 100 caracteres')
        .optional(),

    email: z.string()
        .email('Email inválido')
        .toLowerCase()
        .optional(),

    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .optional(),

    telefono: z.string()
        .optional()
        .nullable(),

    documento: z.string()
        .optional()
        .nullable(),

    roleId: z.string()
        .cuid('ID de rol inválido')
        .optional(),

    activo: z.boolean().optional()
})

export const usuarioFiltersSchema = z.object({
    role: z.string().optional(),
    roleId: z.string().cuid().optional(),
    activo: z.boolean().optional()
})

/**
 * Sistema centralizado de manejo de errores API
 * 
 * Proporciona clases base para errores de aplicación
 * que se pueden usar en todas las capas
 */

/**
 * Error base de la aplicación
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message)
    this.name = this.constructor.name
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Error de validación (400)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: Record<string, any>,
  ) {
    super(message, 400, 'VALIDATION_ERROR')
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details,
    }
  }
}

/**
 * Error de autenticación (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

/**
 * Error de autorización (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

/**
 * Error de recurso no encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND')
  }
}

/**
 * Error de conflicto (409)
 * Usado para violaciones de constraints únicos, duplicados, etc.
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

/**
 * Error de negocio (422)
 * Usado para violaciones de reglas de negocio
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string) {
    super(message, 422, code)
  }
}

/**
 * Error de servicio externo (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`Servicio ${service} no disponible`, 503, 'SERVICE_UNAVAILABLE')
  }
}

/**
 * Maneja errores de Prisma
 */
export function handlePrismaError(error: any): AppError {
  // Error de constraint único violado
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'campo'
    return new ConflictError(`Ya existe un registro con este ${field}`)
  }

  // Error de registro no encontrado
  if (error.code === 'P2025') {
    return new NotFoundError('Registro')
  }

  // Error de constraint de clave foránea
  if (error.code === 'P2003') {
    const relation = error.meta?.field_name || 'relación'
    return new ValidationError(`Referencia inválida: ${relation}`)
  }

  // Otros errores de Prisma
  console.error('[Prisma Error]', error)
  return new AppError('Error en base de datos', 500, 'DATABASE_ERROR')
}

/**
 * Maneja errores de Zod
 */
export function handleZodError(error: any): ValidationError {
  const details: Record<string, string> = {}

  if (error.issues) {
    error.issues.forEach((issue: any) => {
      const path = issue.path.join('.')
      details[path] = issue.message
    })
  }

  return new ValidationError('Validación fallida', details)
}

/**
 * Wrapper para convertir errores a respuesta HTTP
 */
export async function handleAPIError(error: unknown): Promise<Response> {
  console.error('[API Error]', error)

  let appError: AppError

  if (error instanceof AppError) {
    appError = error
  } else if (error instanceof Error) {
    // Errores de Prisma
    if ('code' in error) {
      appError = handlePrismaError(error)
    } else {
      appError = new AppError(error.message, 500, 'INTERNAL_ERROR')
    }
  } else {
    appError = new AppError('Error desconocido', 500, 'INTERNAL_ERROR')
  }

  return Response.json(appError.toJSON(), { status: appError.statusCode })
}

/**
 * Logging de errores con contexto
 */
export function logError(
  error: unknown,
  context: {
    endpoint: string
    method: string
    userId?: string
    requestId?: string
  },
) {
  const timestamp = new Date().toISOString()
  const message = error instanceof Error ? error.message : String(error)

  console.error(`[${timestamp}] [${context.method} ${context.endpoint}] ${message}`, {
    userId: context.userId,
    requestId: context.requestId,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  })
}

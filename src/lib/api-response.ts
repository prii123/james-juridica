/**
 * Utilidades para respuestas HTTP consistentes
 * 
 * Proporciona un patrón consistente para todas las respuestas API
 */

export interface APISuccessResponse<T = any> {
  success: true
  data: T
  timestamp: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  }
}

export interface APIErrorResponse {
  success: false
  error: string
  code: string
  timestamp: string
  details?: Record<string, any>
}

export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse

/**
 * Crea una respuesta exitosa
 */
export function successResponse<T>(
  data: T,
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  },
): APISuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(meta && { meta }),
  }
}

/**
 * Crea una respuesta HTTP exitosa con status 200
 */
export function okResponse<T>(data: T, meta?: any): Response {
  return Response.json(successResponse(data, meta), { status: 200 })
}

/**
 * Crea una respuesta HTTP de recurso creado (201)
 */
export function createdResponse<T>(data: T): Response {
  return Response.json(successResponse(data), { status: 201 })
}

/**
 * Crea una respuesta HTTP de sin contenido (204)
 */
export function noContentResponse(): Response {
  return new Response(null, { status: 204 })
}

/**
 * Crea una respuesta de error
 */
export function errorResponse(
  error: string,
  code: string,
  statusCode: number = 500,
  details?: Record<string, any>,
): Response {
  return Response.json(
    {
      success: false,
      error,
      code,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    } as APIErrorResponse,
    { status: statusCode },
  )
}

/**
 * Crea una respuesta con lista paginada
 */
export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): APISuccessResponse<T[]> {
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return successResponse(items, {
    page,
    limit,
    total,
    hasMore,
  })
}

/**
 * Crea una respuesta HTTP con lista paginada (200)
 */
export function paginatedResponseHTTP<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): Response {
  return okResponse(items, {
    page,
    limit,
    total,
    hasMore: page < Math.ceil(total / limit),
  })
}

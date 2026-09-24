import { Cliente, TipoPersona } from '@prisma/client'
import { prisma } from '@/lib/db'

interface DatosClientePotencial {
  nombre: string
  apellido?: string | null
  email: string
  telefono?: string | null
  documento?: string | null
  tipoPersona?: TipoPersona
  empresa?: string | null
}

export interface ClienteFilters {
  search?: string
  /** Por defecto solo se listan los activos; 'todos' incluye los inactivos. */
  estado?: 'activos' | 'inactivos' | 'todos'
}

export interface UpdateClienteData {
  nombre?: string
  apellido?: string | null
  email?: string
  telefono?: string
  documento?: string
  tipoPersona?: TipoPersona
  empresa?: string | null
  direccion?: string | null
  ciudad?: string | null
  activo?: boolean
}

export class ClientesService {
  /**
   * Busca un cliente por email y, si no existe, lo crea a partir de los datos de un lead o de
   * una asesoría. No sobreescribe uno que ya exista: puede tener datos editados a mano después.
   *
   * Reemplaza la lógica que antes estaba duplicada en varios sitios (aceptar una radicación,
   * facturar una asesoría) y es el punto que usa el paso de Lead a CALIFICADO para crear el
   * cliente automáticamente.
   */
  async obtenerOCrear(datos: DatosClientePotencial): Promise<Cliente> {
    const existente = await prisma.cliente.findUnique({ where: { email: datos.email } })
    if (existente) return existente

    // Sin documento no se puede crear (es único y obligatorio); se usa uno temporal, igual que
    // ya hacían billing.ts y la aceptación de radicaciones, para no bloquear el flujo comercial.
    return prisma.cliente.create({
      data: {
        nombre: datos.nombre,
        apellido: datos.apellido || undefined,
        email: datos.email,
        telefono: datos.telefono || '',
        documento: datos.documento || `TEMP-${Date.now()}`,
        tipoPersona: datos.tipoPersona || 'NATURAL',
        empresa: datos.empresa || undefined,
      },
    })
  }

  /** Azúcar sobre obtenerOCrear para cuando se parte de un Lead. */
  async obtenerOCrearDesdeLead(lead: {
    nombre: string
    email: string
    telefono: string
    documento?: string | null
    tipoPersona?: TipoPersona
    empresa?: string | null
  }): Promise<Cliente> {
    return this.obtenerOCrear(lead)
  }

  /**
   * Clientes ya existentes entre una lista de emails, indexados por email (en minúscula, que es
   * como Prisma compara `mode: 'insensitive'` pero acá se compara en memoria). Se usa para marcar
   * en la lista de Leads cuáles ya son clientes, sin hacer una consulta por cada lead.
   */
  async mapaPorEmails(emails: string[]): Promise<Map<string, Cliente>> {
    if (emails.length === 0) return new Map()
    const clientes = await prisma.cliente.findMany({
      where: { email: { in: Array.from(new Set(emails)) } },
    })
    return new Map(clientes.map((c) => [c.email.toLowerCase(), c]))
  }

  /** Listado paginado para el directorio de clientes (/clientes). */
  async listar(filters: ClienteFilters = {}, page = 1, limit = 20) {
    const where: any = {}
    if (filters.estado === 'activos' || !filters.estado) where.activo = true
    if (filters.estado === 'inactivos') where.activo = false
    // 'todos' no agrega filtro de activo.

    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { apellido: { contains: filters.search, mode: 'insensitive' } },
        { documento: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { telefono: { contains: filters.search } },
      ]
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        include: { _count: { select: { casos: true, facturas: true, radicaciones: true } } },
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cliente.count({ where }),
    ])

    return { clientes, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async obtenerPorId(id: string) {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        casos: { orderBy: { createdAt: 'desc' }, select: { id: true, numeroCaso: true, estado: true, tipoInsolvencia: true, createdAt: true } },
        radicaciones: { orderBy: { createdAt: 'desc' }, select: { id: true, numero: true, estado: true, fechaSolicitud: true } },
        facturas: { orderBy: { fecha: 'desc' }, take: 10, select: { id: true, numero: true, estado: true, total: true, fecha: true } },
      },
    })
    if (!cliente) throw new Error('Cliente no encontrado')
    return cliente
  }

  async actualizar(id: string, data: UpdateClienteData) {
    const existente = await prisma.cliente.findUnique({ where: { id } })
    if (!existente) throw new Error('Cliente no encontrado')

    if (data.email && data.email !== existente.email) {
      const otro = await prisma.cliente.findUnique({ where: { email: data.email } })
      if (otro) throw new Error('Ya existe un cliente con ese email')
    }
    if (data.documento && data.documento !== existente.documento) {
      const otro = await prisma.cliente.findUnique({ where: { documento: data.documento } })
      if (otro) throw new Error('Ya existe un cliente con ese documento')
    }

    return prisma.cliente.update({ where: { id }, data })
  }
}

import { randomUUID } from 'crypto'
import { TipoPersona } from '@prisma/client'
import { prisma } from '@/lib/db'
import { prismaBot } from '@/lib/db-bot'
import { LeadsService } from '@/modules/leads/services'
import { ETAPAS_COMERCIALES, label, labelList, labelRangoDinero } from './labels'

export interface BotContactosFilters {
  search?: string
  etapa?: string
  estadoConversacion?: string
}

export interface SeguimientoData {
  casoId?: string
  etapa_comercial?: string
  notas?: string
  abogado_asignado?: string | null
}

export interface CopiarLeadData {
  nombre: string
  email: string
  telefono: string
  documento?: string
  empresa?: string
  tipoPersona: TipoPersona
  observaciones?: string
  responsableId?: string
}

const ETAPAS_VALIDAS = new Set<string>(ETAPAS_COMERCIALES.map((e) => e.value))

/** El bot guarda el teléfono con indicativo (57xxxxxxxxxx); los leads lo guardan sin indicativo. */
export function normalizarTelefono(telefono: string): string {
  const digits = (telefono || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('57')) return digits.slice(2)
  return digits
}

export function mapTipoPersona(tipo: string | null | undefined): TipoPersona {
  const t = (tipo || '').toLowerCase()
  return t.includes('jur') || t.includes('empresa') ? 'JURIDICA' : 'NATURAL'
}

export class BotService {
  async getContactos(filters: BotContactosFilters = {}, page = 1, limit = 50) {
    const where: any = {}
    if (filters.search) {
      const s = filters.search.trim()
      where.OR = [
        { nombre: { contains: s, mode: 'insensitive' } },
        { nombre_perfil: { contains: s, mode: 'insensitive' } },
        { telefono: { contains: s.replace(/\D/g, '') || s } },
        { email: { contains: s, mode: 'insensitive' } },
        { documento: { contains: s } },
        { ciudad: { contains: s, mode: 'insensitive' } },
      ]
    }
    if (filters.estadoConversacion) where.estado_conversacion = filters.estadoConversacion
    if (filters.etapa) where.casos = { some: { etapa_comercial: filters.etapa } }

    const [contactos, total] = await Promise.all([
      prismaBot.contactos.findMany({
        where,
        include: {
          casos: { orderBy: { created_at: 'desc' }, take: 1 },
          _count: { select: { mensajes: true } },
        },
        orderBy: [{ ultimo_mensaje_at: { sort: 'desc', nulls: 'last' } }, { created_at: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prismaBot.contactos.count({ where }),
    ])

    // Si se filtra por etapa, asegurar que sea la etapa del caso más reciente
    const filtrados = filters.etapa
      ? contactos.filter((c) => c.casos[0]?.etapa_comercial === filters.etapa)
      : contactos

    return {
      contactos: filtrados.map(({ casos, _count, ...c }) => ({
        ...c,
        caso: casos[0] ?? null,
        totalMensajes: _count.mensajes,
      })),
      total,
      page,
      limit,
    }
  }

  async getStats() {
    const contactos = await prismaBot.contactos.findMany({
      select: {
        estado_conversacion: true,
        casos: { orderBy: { created_at: 'desc' }, take: 1, select: { etapa_comercial: true } },
      },
    })

    const porEtapa: Record<string, number> = {}
    for (const e of ETAPAS_COMERCIALES) porEtapa[e.value] = 0
    let esperandoHumano = 0
    for (const c of contactos) {
      const etapa = c.casos[0]?.etapa_comercial ?? 'nuevo'
      porEtapa[etapa] = (porEtapa[etapa] ?? 0) + 1
      if (c.estado_conversacion === 'ESPERANDO_HUMANO') esperandoHumano++
    }

    const estadosConversacion = await prismaBot.contactos.groupBy({
      by: ['estado_conversacion'],
      _count: true,
    })

    return {
      total: contactos.length,
      esperandoHumano,
      porEtapa,
      estadosConversacion: estadosConversacion.map((e) => ({ value: e.estado_conversacion, count: e._count })),
    }
  }

  /**
   * Resumen liviano de los clientes que esperan abogado, pensado para consultarse seguido
   * desde el layout (contador del menú, campana y notificaciones).
   */
  async getPendientes(limit = 20) {
    const where = { estado_conversacion: 'ESPERANDO_HUMANO' }
    const [total, contactos] = await Promise.all([
      prismaBot.contactos.count({ where }),
      prismaBot.contactos.findMany({
        where,
        select: { id: true, nombre: true, nombre_perfil: true, telefono: true, ultimo_mensaje_at: true },
        orderBy: { ultimo_mensaje_at: { sort: 'desc', nulls: 'last' } },
        take: limit,
      }),
    ])

    return {
      total,
      contactos: contactos.map((c) => ({
        id: c.id,
        nombre: c.nombre || c.nombre_perfil || c.telefono,
        ultimoMensajeAt: c.ultimo_mensaje_at,
      })),
    }
  }

  async getContactoById(id: string) {
    const contacto = await prismaBot.contactos.findUnique({
      where: { id },
      include: {
        casos: { orderBy: { created_at: 'desc' } },
        mensajes: { orderBy: { created_at: 'asc' }, take: 300 },
        respuestas_captura: { orderBy: { created_at: 'asc' } },
      },
    })
    if (!contacto) throw new Error('Contacto no encontrado')

    const leadExistente = await this.findLeadExistente(contacto.telefono, contacto.email)

    return {
      ...contacto,
      caso: contacto.casos[0] ?? null,
      leadExistente,
      leadBorrador: this.buildLeadBorrador(contacto),
    }
  }

  private async findLeadExistente(telefono: string, email: string | null) {
    const tel = normalizarTelefono(telefono)
    const or: any[] = [{ telefono: tel }, { telefono }]
    if (email) or.push({ email: { equals: email, mode: 'insensitive' } })
    return prisma.lead.findFirst({
      where: { OR: or },
      select: { id: true, nombre: true, estado: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  /** Datos sugeridos para crear el lead a partir de lo capturado por el bot. */
  private buildLeadBorrador(contacto: any): CopiarLeadData {
    const caso = contacto.casos?.[0]
    const resumen: string[] = ['Capturado por el chatbot de WhatsApp.']
    if (contacto.tipo_persona) resumen.push(`Tipo: ${label('tipo_persona', contacto.tipo_persona)}`)
    if (contacto.ciudad) resumen.push(`Ciudad: ${contacto.ciudad}`)
    if (caso) {
      if (caso.situacion) resumen.push(`Situación: ${label('situacion', caso.situacion)}`)
      if (caso.rango_deuda) resumen.push(`Deuda total: ${labelRangoDinero(caso.rango_deuda)}`)
      if (caso.num_acreedores) {
        resumen.push(`Acreedores: ${label('num_acreedores', caso.num_acreedores)} (${labelList('tipos_acreedores', caso.tipos_acreedores)})`)
      }
      if (caso.tiene_bienes !== null && caso.tiene_bienes !== undefined) {
        resumen.push(`Bienes: ${caso.tiene_bienes ? labelList('bienes', caso.bienes) : 'No tiene'}`)
      }
      if (caso.rango_ingresos) resumen.push(`Ingresos: ${labelRangoDinero(caso.rango_ingresos)}`)
      if (caso.procesos_judiciales) resumen.push(`Procesos judiciales: ${label('procesos_judiciales', caso.procesos_judiciales)}`)
      if (caso.preferencia_contacto || caso.horario_contacto) {
        const pref = [label('preferencia_contacto', caso.preferencia_contacto), caso.horario_contacto]
          .filter((v) => v && v !== '-')
          .join(', ')
        resumen.push(`Contacto preferido: ${pref}`)
      }
      if (caso.notas) resumen.push(`Notas: ${caso.notas}`)
    }

    return {
      nombre: contacto.nombre || contacto.nombre_perfil || '',
      email: contacto.email || '',
      telefono: normalizarTelefono(contacto.telefono),
      documento: contacto.documento || '',
      empresa: '',
      tipoPersona: mapTipoPersona(contacto.tipo_persona),
      observaciones: resumen.join('\n').slice(0, 1000),
    }
  }

  async updateSeguimiento(contactoId: string, data: SeguimientoData) {
    const contacto = await prismaBot.contactos.findUnique({
      where: { id: contactoId },
      include: { casos: { orderBy: { created_at: 'desc' }, take: 1 } },
    })
    if (!contacto) throw new Error('Contacto no encontrado')

    if (data.etapa_comercial !== undefined && !ETAPAS_VALIDAS.has(data.etapa_comercial)) {
      throw new Error('Etapa comercial inválida')
    }

    const update: any = { updated_at: new Date() }
    if (data.etapa_comercial !== undefined) update.etapa_comercial = data.etapa_comercial
    if (data.notas !== undefined) update.notas = data.notas
    if (data.abogado_asignado !== undefined) update.abogado_asignado = data.abogado_asignado || null

    const casoId = data.casoId ?? contacto.casos[0]?.id
    if (casoId) {
      return prismaBot.casos.update({ where: { id: casoId }, data: update })
    }

    // El contacto aún no tiene caso: se crea uno para poder hacer el seguimiento
    return prismaBot.casos.create({
      data: {
        id: randomUUID(),
        contacto_id: contactoId,
        etapa_comercial: data.etapa_comercial ?? 'nuevo',
        notas: data.notas ?? null,
        abogado_asignado: data.abogado_asignado ?? null,
        updated_at: new Date(),
      },
    })
  }

  async copiarALeads(contactoId: string, data: CopiarLeadData) {
    const contacto = await prismaBot.contactos.findUnique({
      where: { id: contactoId },
      include: { casos: { orderBy: { created_at: 'desc' }, take: 1 } },
    })
    if (!contacto) throw new Error('Contacto no encontrado')

    const leadsService = new LeadsService()
    const lead = await leadsService.createLead({
      nombre: data.nombre,
      email: data.email,
      telefono: normalizarTelefono(data.telefono),
      documento: data.documento || undefined,
      empresa: data.empresa || undefined,
      tipoPersona: data.tipoPersona,
      origen: 'Bot WhatsApp',
      observaciones: data.observaciones || undefined,
      responsableId: data.responsableId,
    })

    // Dejar rastro en el caso del bot
    const caso = contacto.casos[0]
    if (caso) {
      const marca = `[${new Date().toLocaleString('es-CO')}] Copiado a Leads (${lead.id})`
      await prismaBot.casos.update({
        where: { id: caso.id },
        data: {
          notas: caso.notas ? `${caso.notas}\n${marca}` : marca,
          updated_at: new Date(),
        },
      })
    }

    return lead
  }
}

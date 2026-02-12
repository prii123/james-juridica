import { prisma } from './db'
import { TipoInsolvencia, EstadoCaso, Prioridad, EstadoLead, EstadoAsesoria, EstadoConciliacion, EstadoHonorario, EstadoFactura } from '@prisma/client'
import { LeadsService } from '@/modules/leads/services'
import { CasosService } from '@/modules/casos/services'

// ========================================
// WORKFLOW DE NEGOCIO JURÍDICO
// ========================================

// Tipos para el workflow principal del negocio
export interface BusinessWorkflowStep {
  id: string
  name: string
  description: string
  requiredFields?: string[]
  validations?: string[]
  allowedTransitions?: string[]
}

export interface BusinessWorkflowDefinition {
  id: string
  name: string
  description: string
  steps: BusinessWorkflowStep[]
}

// Workflow principal: Lead → Asesoría → Conciliación → Caso → Actuaciones → Honorarios → Facturación → Cartera
export const BUSINESS_WORKFLOW: BusinessWorkflowDefinition = {
  id: 'business_flow',
  name: 'Flujo de Negocio Jurídico',
  description: 'Workflow principal desde lead hasta cartera',
  steps: [
    {
      id: 'lead',
      name: 'Lead',
      description: 'Prospecto inicial de cliente',
      allowedTransitions: ['asesoria']
    },
    {
      id: 'asesoria',
      name: 'Asesoría',
      description: 'Consulta jurídica inicial',
      allowedTransitions: ['conciliacion', 'caso']
    },
    {
      id: 'conciliacion',
      name: 'Conciliación',
      description: 'Intento de resolución extrajudicial',
      allowedTransitions: ['caso', 'closed']
    },
    {
      id: 'caso',
      name: 'Caso Jurídico',
      description: 'Proceso judicial formal',
      allowedTransitions: ['actuaciones']
    },
    {
      id: 'actuaciones',
      name: 'Actuaciones',
      description: 'Diligencias y trámites procesales',
      allowedTransitions: ['honorarios']
    },
    {
      id: 'honorarios',
      name: 'Honorarios',
      description: 'Definición de costos profesionales',
      allowedTransitions: ['facturacion']
    },
    {
      id: 'facturacion',
      name: 'Facturación',
      description: 'Emisión de factura',
      allowedTransitions: ['cartera']
    },
    {
      id: 'cartera',
      name: 'Cartera',
      description: 'Gestión de cobranza',
      allowedTransitions: ['closed']
    }
]
}

// ========================================
// FUNCIONES DE TRANSICIÓN DEL WORKFLOW DE NEGOCIO
// ========================================

export class BusinessWorkflowService {
  
  // Validar si una transición es permitida
  static validateTransition(currentStep: string, nextStep: string): boolean {
    const step = BUSINESS_WORKFLOW.steps.find(s => s.id === currentStep)
    return step?.allowedTransitions?.includes(nextStep) || false
  }

  // Lead → Asesoría
  static async leadToAsesoria(data: {
    leadId: string
    asesoriaData: {
      tipo: 'INICIAL'
      fecha: Date
      tema: string
      descripcion?: string
      asesorId: string
      valor?: number
    }
  }) {
    if (!this.validateTransition('lead', 'asesoria')) {
      throw new Error('Transición no permitida: Lead → Asesoría')
    }

    // Verificar que el lead existe y está en estado válido
    const lead = await prisma.lead.findUnique({
      where: { id: data.leadId }
    })

    if (!lead) {
      throw new Error('Lead no encontrado')
    }

    if (!['NUEVO', 'CONTACTADO', 'CALIFICADO'].includes(lead.estado)) {
      throw new Error(`Lead en estado ${lead.estado} no puede generar asesoría`)
    }

    const result = await prisma.$transaction(async (tx) => {
      // Crear la asesoría
      const asesoria = await tx.asesoria.create({
        data: {
          ...data.asesoriaData,
          leadId: data.leadId,
          estado: 'PROGRAMADA'
        }
      })

      // Actualizar el estado del lead
      await tx.lead.update({
        where: { id: data.leadId },
        data: { 
          estado: 'CONVERTIDO',
          observaciones: `Convertido a asesoría ${asesoria.id} el ${new Date().toISOString()}`
        }
      })

      return asesoria
    })

    return result
  }

  // Asesoría → Conciliación
  static async asesoriaToConsiliacion(data: {
    asesoriaId: string
    conciliacionData: {
      demandante: string
      demandado: string
      valor: number
      observaciones?: string
    }
  }) {
    if (!this.validateTransition('asesoria', 'conciliacion')) {
      throw new Error('Transición no permitida: Asesoría → Conciliación')
    }

    const asesoria = await prisma.asesoria.findUnique({
      where: { id: data.asesoriaId },
      include: { lead: true }
    })

    if (!asesoria) {
      throw new Error('Asesoría no encontrada')
    }

    if (asesoria.estado !== 'REALIZADA') {
      throw new Error('La asesoría debe estar realizada para generar conciliación')
    }

    const result = await prisma.$transaction(async (tx) => {
      // Generar número de conciliación
      const numero = await this.generateConciliacionNumber()
      
      const conciliacion = await tx.conciliacion.create({
        data: {
          numero,
          estado: 'SOLICITADA',
          asesoriaId: data.asesoriaId,
          ...data.conciliacionData
        }
      })

      // Actualizar observaciones de la asesoría
      await tx.asesoria.update({
        where: { id: data.asesoriaId },
        data: {
          notas: `${asesoria.notas || ''}\nGeneró conciliación ${conciliacion.numero} el ${new Date().toISOString()}`
        }
      })

      return conciliacion
    })

    return result
  }

  // Asesoría → Caso (directo, sin conciliación)
  static async asesoriaToCase(data: {
    asesoriaId: string
    casoData: {
      tipoInsolvencia: TipoInsolvencia
      valorDeuda: number
      clienteId: string
      responsableId: string
      creadoPorId: string
      observaciones?: string
    }
  }) {
    if (!this.validateTransition('asesoria', 'caso')) {
      throw new Error('Transición no permitida: Asesoría → Caso')
    }

    const asesoria = await prisma.asesoria.findUnique({
      where: { id: data.asesoriaId },
      include: { lead: true }
    })

    if (!asesoria) {
      throw new Error('Asesoría no encontrada')
    }

    if (asesoria.estado !== 'REALIZADA') {
      throw new Error('La asesoría debe estar realizada para generar caso')
    }

    const casosService = new CasosService()
    
    const result = await prisma.$transaction(async (tx) => {
      // Crear el caso usando el servicio
      const caso = await casosService.createCaso(data.casoData)

      // Vincular asesoría al caso
      await tx.asesoria.update({
        where: { id: data.asesoriaId },
        data: { 
          notas: `${asesoria.notas || ''}\nGeneró caso ${caso.numeroCaso} el ${new Date().toISOString()}`
        }
      })

      return caso
    })

    return result
  }

  // Conciliación → Caso
  static async conciliacionToCase(data: {
    conciliacionId: string
    casoData: {
      tipoInsolvencia: TipoInsolvencia
      valorDeuda: number
      clienteId: string
      responsableId: string
      creadoPorId: string
      observaciones?: string
    }
  }) {
    if (!this.validateTransition('conciliacion', 'caso')) {
      throw new Error('Transición no permitida: Conciliación → Caso')
    }

    const conciliacion = await prisma.conciliacion.findUnique({
      where: { id: data.conciliacionId }
    })

    if (!conciliacion) {
      throw new Error('Conciliación no encontrada')
    }

    if (conciliacion.resultado !== 'SIN_ACUERDO') {
      throw new Error('Solo conciliaciones sin acuerdo pueden generar caso judicial')
    }

    // Usar datos de la conciliación para crear el caso
    const casoCompleteData = {
      ...data.casoData,
      valorDeuda: conciliacion.valor.toNumber(),
      observaciones: `${data.casoData.observaciones || ''} - Generado desde conciliación ${conciliacion.numero} (${conciliacion.demandante} vs ${conciliacion.demandado})`
    }

    const casosService = new CasosService()
    
    const result = await prisma.$transaction(async (tx) => {
      const caso = await casosService.createCaso(casoCompleteData)

      return caso
    })

    return result
  }

  // Caso → Honorarios
  static async casoToHonorarios(data: {
    casoId: string
    honorarioData: {
      tipo: 'ASESORIA' | 'REPRESENTACION' | 'TRAMITE' | 'GESTION_COBRANZA'
      modalidadPago: 'CONTADO' | 'FINANCIADO'
      valor: number
      numeroCuotas?: number
      valorCuota?: number
      observaciones?: string
    }
  }) {
    if (!this.validateTransition('caso', 'honorarios')) {
      throw new Error('Transición no permitida: Caso → Honorarios')
    }

    const caso = await prisma.caso.findUnique({
      where: { id: data.casoId }
    })

    if (!caso) {
      throw new Error('Caso no encontrado')
    }

    if (caso.estado !== 'ACTIVO') {
      throw new Error('Solo casos activos pueden generar honorarios')
    }

    const fechaVencimiento = new Date()
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)

    const result = await prisma.honorario.create({
      data: {
        ...data.honorarioData,
        casoId: data.casoId,
        fechaVencimiento,
        estado: 'PENDIENTE'
      }
    })

    return result
  }

  // Honorarios → Facturación
  static async honorariosToFacturacion(data: {
    honorarioId: string
    creadoPorId: string
    clienteData?: {
      nombre?: string
      documento?: string
      email?: string
      telefono?: string
      direccion?: string
    }
  }) {
    if (!this.validateTransition('honorarios', 'facturacion')) {
      throw new Error('Transición no permitida: Honorarios → Facturación')
    }

    const honorario = await prisma.honorario.findUnique({
      where: { id: data.honorarioId },
      include: { caso: true }
    })

    if (!honorario) {
      throw new Error('Honorario no encontrado')
    }

    if (honorario.estado !== 'PENDIENTE') {
      throw new Error('Solo honorarios pendientes pueden generar factura')
    }

    // Generar número de factura
    const numero = await this.generateFacturaNumber()
    const fechaVencimiento = new Date()
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)

    const subtotal = honorario.valor.toNumber()
    const iva = subtotal * 0.19
    const total = subtotal + iva

    const result = await prisma.$transaction(async (tx) => {
      const factura = await tx.factura.create({
        data: {
          numero,
          fechaVencimiento,
          subtotal,
          impuestos: iva,
          total,
          honorarioId: data.honorarioId,
          creadoPorId: data.creadoPorId,
          estado: 'GENERADA',
          items: {
            create: {
              descripcion: `Honorarios profesionales - ${honorario.tipo} - Caso: ${honorario.caso.numeroCaso}`,
              cantidad: 1,
              valorUnitario: subtotal,
              valorTotal: subtotal
            }
          }
        },
        include: { 
          items: true,
          honorario: {
            include: {
              caso: {
                include: {
                  cliente: true
                }
              }
            }
          }
        }
      })

      // Marcar honorario como facturado
      await tx.honorario.update({
        where: { id: data.honorarioId },
        data: { estado: 'PAGADO' } // Asumir pagado al facturar, mejorar lógica
      })

      return factura
    })

    return result
  }

  // Facturación → Cartera
  static async facturacionToCartera(data: {
    facturaId: string
    diasVencimiento?: number
  }) {
    if (!this.validateTransition('facturacion', 'cartera')) {
      throw new Error('Transición no permitida: Facturación → Cartera')
    }

    const factura = await prisma.factura.findUnique({
      where: { id: data.facturaId },
      include: { 
        pagos: true,
        honorario: {
          include: {
            caso: {
              include: {
                cliente: true
              }
            }
          }
        }
      }
    })

    if (!factura) {
      throw new Error('Factura no encontrada')
    }

    const totalPagado = factura.pagos.reduce((sum, pago) => sum + pago.valor.toNumber(), 0)
    const saldoPendiente = factura.total.toNumber() - totalPagado

    if (saldoPendiente <= 0) {
      throw new Error('La factura ya está pagada completamente')
    }

    // Si la factura está vencida o se especifica, crear registro en cartera
    const facturaVencida = factura.fechaVencimiento < new Date()
    const diasEspecificados = data.diasVencimiento && data.diasVencimiento > 0

    if (facturaVencida || diasEspecificados) {
      const cartera = await prisma.cartera.create({
        data: {
          concepto: `Factura ${factura.numero} - Honorarios profesionales`,
          valor: saldoPendiente,
          saldo: saldoPendiente,
          fechaVencimiento: factura.fechaVencimiento,
          honorarioId: factura.honorarioId,
          estado: 'ACTIVA'
        }
      })

      // Marcar factura como vencida si corresponde
      if (facturaVencida && factura.estado !== 'VENCIDA') {
        await prisma.factura.update({
          where: { id: data.facturaId },
          data: { estado: 'VENCIDA' }
        })
      }

      return cartera
    }

    throw new Error('La factura no está vencida y no se ha especificado movimiento a cartera')
  }

  // Utilidades para generar números únicos
  private static async generateConciliacionNumber(): Promise<string> {
    const currentYear = new Date().getFullYear()
    const prefix = `CONC-${currentYear}`
    
    const lastRecord = await prisma.conciliacion.findFirst({
      where: { numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' }
    })

    let nextNumber = 1
    if (lastRecord) {
      const lastNumber = parseInt(lastRecord.numero.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`
  }

  private static async generateFacturaNumber(): Promise<string> {
    const currentYear = new Date().getFullYear()
    const prefix = `FAC-${currentYear}`
    
    const lastRecord = await prisma.factura.findFirst({
      where: { numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' }
    })

    let nextNumber = 1
    if (lastRecord) {
      const lastNumber = parseInt(lastRecord.numero.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`
  }

  // Función para obtener el estado actual de un workflow
  static async getWorkflowStatus(entityType: string, entityId: string) {
    let entity: any = null
    let currentStep = 'lead'

    switch (entityType) {
      case 'lead':
        entity = await prisma.lead.findUnique({
          where: { id: entityId },
          include: { asesorias: true }
        })
        currentStep = entity?.asesorias?.length > 0 ? 'asesoria' : 'lead'
        break
      
      case 'asesoria':
        entity = await prisma.asesoria.findUnique({
          where: { id: entityId }
        })
        currentStep = 'asesoria'
        break
      
      case 'caso':
        entity = await prisma.caso.findUnique({
          where: { id: entityId },
          include: { 
            honorarios: true,
            actuaciones: true
          }
        })
        if (entity?.honorarios?.length > 0) currentStep = 'honorarios'
        else if (entity?.actuaciones?.length > 0) currentStep = 'actuaciones'
        else currentStep = 'caso'
        break
        
      default:
        throw new Error(`Tipo de entidad no soportado: ${entityType}`)
    }

    if (!entity) {
      throw new Error(`Entidad no encontrada: ${entityType}:${entityId}`)
    }

    const step = BUSINESS_WORKFLOW.steps.find(s => s.id === currentStep)
    return {
      entity,
      currentStep,
      stepInfo: step,
      allowedTransitions: step?.allowedTransitions || []
    }
  }
}

// ========================================
// WORKFLOWS ESPECÍFICOS DE INSOLVENCIA
// ========================================

// Definiciones de workflows para procesos de insolvencia
export const INSOLVENCY_WORKFLOWS: Record<string, WorkflowDefinition> = {
  REORGANIZACION: {
    id: 'reorganizacion',
    name: 'Proceso de Reorganización',
    description: 'Workflow para proceso de reorganización empresarial',
    applicableTypes: ['REORGANIZACION'],
    steps: [
      {
        id: 'solicitud',
        name: 'Solicitud de Admisión',
        description: 'Presentación de solicitud ante el juez',
        requiredDocuments: ['DEMANDA', 'ESTADOS_FINANCIEROS', 'RUT'],
        isRequired: true,
        nextSteps: ['auto_admisorio']
      },
      {
        id: 'auto_admisorio',
        name: 'Auto Admisorio',
        description: 'Espera del auto que admite el proceso',
        isRequired: true,
        nextSteps: ['verificacion_creditos']
      },
      {
        id: 'verificacion_creditos',
        name: 'Verificación y Graduación de Créditos',
        description: 'Proceso de verificación de créditos',
        isRequired: true,
        nextSteps: ['audiencia_confirmacion']
      },
      {
        id: 'audiencia_confirmacion',
        name: 'Audiencia de Confirmación',
        description: 'Audiencia para confirmar el acuerdo',
        isRequired: true,
        nextSteps: ['cumplimiento']
      },
      {
        id: 'cumplimiento',
        name: 'Cumplimiento del Acuerdo',
        description: 'Seguimiento del cumplimiento',
        isRequired: true
      }
    ]
  },
  
  LIQUIDACION: {
    id: 'liquidacion',
    name: 'Liquidación Judicial',
    description: 'Workflow para liquidación judicial de empresas',
    applicableTypes: ['LIQUIDACION_JUDICIAL'],
    steps: [
      {
        id: 'solicitud_liquidacion',
        name: 'Solicitud de Liquidación',
        description: 'Presentación de solicitud de liquidación',
        requiredDocuments: ['DEMANDA', 'ESTADOS_FINANCIEROS'],
        isRequired: true,
        nextSteps: ['auto_apertura']
      },
      {
        id: 'auto_apertura',
        name: 'Auto de Apertura',
        description: 'Auto que abre el proceso de liquidación',
        isRequired: true,
        nextSteps: ['inventario_bienes']
      },
      {
        id: 'inventario_bienes',
        name: 'Inventario y Avalúo',
        description: 'Inventario y avalúo de los bienes',
        isRequired: true,
        nextSteps: ['enajenacion']
      },
      {
        id: 'enajenacion',
        name: 'Enajenación de Bienes',
        description: 'Proceso de venta de bienes',
        isRequired: true,
        nextSteps: ['pago_creditos']
      },
      {
        id: 'pago_creditos',
        name: 'Pago a Acreedores',
        description: 'Distribución de recursos entre acreedores',
        isRequired: true,
        nextSteps: ['clausura']
      },
      {
        id: 'clausura',
        name: 'Clausura del Proceso',
        description: 'Cierre del proceso de liquidación',
        isRequired: true
      }
    ]
  },

  PERSONA_NATURAL: {
    id: 'persona_natural',
    name: 'Insolvencia Persona Natural',
    description: 'Workflow para insolvencia de persona natural',
    applicableTypes: ['INSOLVENCIA_PERSONA_NATURAL'],
    steps: [
      {
        id: 'solicitud_insolvencia',
        name: 'Solicitud de Insolvencia',
        description: 'Presentación de solicitud de insolvencia',
        requiredDocuments: ['DEMANDA', 'CEDULA', 'CERTIFICACION_BANCARIA'],
        isRequired: true,
        nextSteps: ['auto_admision']
      },
      {
        id: 'auto_admision',
        name: 'Auto de Admisión',
        description: 'Auto que admite el proceso',
        isRequired: true,
        nextSteps: ['negociacion_acuerdo']
      },
      {
        id: 'negociacion_acuerdo',
        name: 'Negociación de Acuerdo',
        description: 'Negociación con acreedores',
        isRequired: true,
        nextSteps: ['formalizacion', 'liquidacion_patrimonial']
      },
      {
        id: 'formalizacion',
        name: 'Formalización del Acuerdo',
        description: 'Formalización del acuerdo de pago',
        isRequired: false,
        nextSteps: ['cumplimiento_acuerdo']
      },
      {
        id: 'liquidacion_patrimonial',
        name: 'Liquidación Patrimonial',
        description: 'Liquidación del patrimonio del deudor',
        isRequired: false,
        nextSteps: ['liberacion_deudas']
      },
      {
        id: 'cumplimiento_acuerdo',
        name: 'Cumplimiento del Acuerdo',
        description: 'Seguimiento del cumplimiento del acuerdo',
        isRequired: false
      },
      {
        id: 'liberacion_deudas',
        name: 'Liberación de Deudas',
        description: 'Decreto de liberación de deudas',
        isRequired: false
      }
    ]
  }
}

// Funciones para manejar workflows de insolvencia
export async function getWorkflowForCase(casoId: string): Promise<WorkflowDefinition | null> {
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    select: { tipoInsolvencia: true }
  })

  if (!caso) return null

  switch (caso.tipoInsolvencia) {
    case 'REORGANIZACION':
    case 'ACUERDO_REORGANIZACION':
      return INSOLVENCY_WORKFLOWS.REORGANIZACION
    case 'LIQUIDACION_JUDICIAL':
      return INSOLVENCY_WORKFLOWS.LIQUIDACION
    case 'INSOLVENCIA_PERSONA_NATURAL':
      return INSOLVENCY_WORKFLOWS.PERSONA_NATURAL
    default:
      return null
  }
}

export async function getNextStepsForCase(casoId: string): Promise<WorkflowStep[]> {
  const workflow = await getWorkflowForCase(casoId)
  if (!workflow) return []

  // Obtener actuaciones completadas del caso
  const actuaciones = await prisma.actuacion.findMany({
    where: { 
      casoId,
      estado: 'RESPONDIDA'
    }
  })

  // Lógica para determinar próximos pasos basado en actuaciones completadas
  const completedSteps = new Set(actuaciones.map(a => a.tipo.toLowerCase()))
  
  return workflow.steps.filter(step => {
    // Si el paso no está completado y no tiene dependencias, o sus dependencias están completadas
    if (completedSteps.has(step.id)) return false
    
    if (!step.nextSteps || step.nextSteps.length === 0) return true
    
    // Verificar si al menos uno de los pasos anteriores está completado
    const hasPrerequisites = workflow.steps.some(prevStep => 
      prevStep.nextSteps?.includes(step.id) && completedSteps.has(prevStep.id)
    )
    
    return hasPrerequisites || workflow.steps.indexOf(step) === 0
  })
}

export function calculateCasePriority(
  valorDeuda: number,
  fechaInicio: Date,
  tipoInsolvencia: TipoInsolvencia
): Prioridad {
  const now = new Date()
  const diasTranscurridos = Math.floor((now.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24))
  
  // Reglas de prioridad
  if (valorDeuda > 1000000000) return 'CRITICA' // Más de 1.000 millones
  if (valorDeuda > 500000000) return 'ALTA'     // Más de 500 millones
  if (diasTranscurridos > 90) return 'ALTA'     // Más de 90 días
  if (tipoInsolvencia === 'LIQUIDACION_JUDICIAL') return 'ALTA'
  if (diasTranscurridos > 30) return 'MEDIA'    // Más de 30 días
  
  return 'BAJA'
}

export async function updateCasePriorities(): Promise<void> {
  const casos = await prisma.caso.findMany({
    where: { estado: 'ACTIVO' }
  })

  for (const caso of casos) {
    const newPriority = calculateCasePriority(
      caso.valorDeuda.toNumber(),
      caso.fechaInicio,
      caso.tipoInsolvencia
    )

    if (newPriority !== caso.prioridad) {
      await prisma.caso.update({
        where: { id: caso.id },
        data: { prioridad: newPriority }
      })
    }
  }
}

// Tipos para workflows específicos de insolvencia
export interface WorkflowStep {
  id: string
  name: string
  description: string
  requiredDocuments?: string[]
  nextSteps?: string[]
  isRequired: boolean
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  applicableTypes: TipoInsolvencia[]
}


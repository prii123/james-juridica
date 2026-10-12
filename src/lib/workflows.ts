import { prisma } from './db'
import { TipoInsolvencia, Prioridad } from '@prisma/client'

// Workflows de insolvencia (los pasos por tipo de proceso) y cálculo de prioridad de casos.
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
  fechaInicio: Date,
  tipoInsolvencia: TipoInsolvencia
): Prioridad {
  const now = new Date()
  const diasTranscurridos = Math.floor((now.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24))
  
  // Reglas de prioridad basadas en tiempo y tipo
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


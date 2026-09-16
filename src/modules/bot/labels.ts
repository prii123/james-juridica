// Etiquetas legibles para los valores normalizados que guarda el chatbot.
// Los valores desconocidos se "humanizan" (guiones bajos -> espacios, primera letra mayúscula).

// badgeVariant corresponde a las variantes del componente <Badge> (src/components/ui/Badge.tsx)
export const ETAPAS_COMERCIALES = [
  { value: 'nuevo', label: 'Nuevo', badgeVariant: 'primary' },
  { value: 'contactado', label: 'Contactado', badgeVariant: 'info' },
  { value: 'en_seguimiento', label: 'En seguimiento', badgeVariant: 'warning' },
  { value: 'calificado', label: 'Calificado', badgeVariant: 'secondary' },
  { value: 'convertido', label: 'Convertido', badgeVariant: 'success' },
  { value: 'descartado', label: 'Descartado', badgeVariant: 'danger' },
] as const

export type EtapaComercial = (typeof ETAPAS_COMERCIALES)[number]['value']

const ETAPA_BY_VALUE = new Map<string, (typeof ETAPAS_COMERCIALES)[number]>(
  ETAPAS_COMERCIALES.map((e) => [e.value, e]),
)

const LABELS: Record<string, Record<string, string>> = {
  situacion: {
    al_dia: 'Al día',
    sin_capacidad: 'Al día, sin capacidad',
    en_mora: 'En mora',
    embargo: 'Con embargo',
    demandado: 'Demandado',
  },
  num_acreedores: {
    '1': 'Uno',
    '1_2': 'De 1 a 2',
    '2': 'Dos',
    '3_5': 'De 3 a 5',
    '6_10': 'De 6 a 10',
    mas_10: 'Más de 10',
    mas_5: 'Más de 5',
  },
  tipos_acreedores: {
    bancos: 'Bancos',
    cooperativas: 'Cooperativas',
    tarjetas: 'Tarjetas de crédito',
    fintech: 'Fintech / créditos en línea',
    particulares: 'Particulares',
    gota_gota: 'Gota a gota',
    proveedores: 'Proveedores',
    dian: 'DIAN / impuestos',
    otros: 'Otros',
  },
  bienes: {
    casa: 'Casa o apartamento',
    vehiculo: 'Vehículo',
    moto: 'Moto',
    lote: 'Lote / terreno',
    local: 'Local comercial',
    otros: 'Otros',
    ninguno: 'Ninguno',
  },
  procesos_judiciales: {
    si: 'Sí',
    no: 'No',
    no_sabe: 'No está seguro/a',
  },
  preferencia_contacto: {
    llamada: 'Llamada',
    whatsapp: 'WhatsApp',
    email: 'Correo electrónico',
    videollamada: 'Videollamada',
  },
  tipo_persona: {
    natural: 'Persona natural',
    comerciante: 'Comerciante',
    empresa: 'Empresa',
    juridica: 'Persona jurídica',
  },
  estado_conversacion: {
    BIENVENIDA: 'Bienvenida',
    ESPERANDO_HUMANO: 'Esperando abogado',
    FINALIZADO: 'Finalizado',
    CIERRE: 'Cierre',
  },
}

export function humanize(value: string | null | undefined): string {
  if (!value) return '-'
  const text = String(value).replace(/_/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/** Rangos de dinero tipo "100m_300m", "menos_20m", "mas_500m" -> "$100 a $300 millones". */
export function labelRangoDinero(value: string | null | undefined): string {
  if (!value) return '-'
  let m = value.match(/^(\d+)m_(\d+)m$/i)
  if (m) return `$${m[1]} a $${m[2]} millones`
  m = value.match(/^menos_(\d+)m$/i)
  if (m) return `Menos de $${m[1]} millones`
  m = value.match(/^mas_(\d+)m$/i)
  if (m) return `Más de $${m[1]} millones`
  return humanize(value)
}

export function label(field: keyof typeof LABELS | string, value: string | null | undefined): string {
  if (!value) return '-'
  return LABELS[field]?.[value] ?? humanize(value)
}

export function labelList(field: string, values: unknown): string {
  if (!Array.isArray(values) || values.length === 0) return '-'
  return values.map((v) => label(field, String(v))).join(', ')
}

export function etapaInfo(value: string | null | undefined) {
  return ETAPA_BY_VALUE.get(value || 'nuevo') ?? { value: value || 'nuevo', label: humanize(value), badgeVariant: 'secondary' as const }
}

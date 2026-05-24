import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib'

interface FacturaData {
  id: string
  numero: string
  fecha: Date
  fechaVencimiento: Date
  subtotal: number
  impuestos: number
  total: number
  estado: string
  ivaActivado: boolean
  observaciones?: string | null
  honorario?: {
    tipo: string
    caso: {
      numeroCaso: string
      cliente: {
        nombre: string
        apellido?: string | null
        documento: string
        email: string
        telefono: string
      }
    }
  } | null
  cliente?: {
    nombre: string
    apellido?: string | null
    documento: string
    email: string
    telefono: string
  } | null
  clienteNombre?: string | null
  items: {
    descripcion: string
    cantidad: number
    valorUnitario: number
    valorTotal: number
  }[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const MARGIN = 50
const FONT_SIZE = 9
const HEADER_SIZE = 22
const SUBHEADER_SIZE = 16
const SMALL_SIZE = 8
const LINE_HEIGHT = 14
const PAGE_HEIGHT = PageSizes.Letter[1]

export async function generateFacturaPDF(factura: FacturaData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  let currentPage = doc.addPage(PageSizes.Letter)
  const pageWidth = currentPage.getSize().width

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = PAGE_HEIGHT - MARGIN

  function text(
    txt: string,
    x: number,
    yPos: number,
    opts: { font?: typeof font; size?: number; color?: ReturnType<typeof rgb> } = {},
  ) {
    currentPage.drawText(txt, {
      x,
      y: yPos,
      size: opts.size ?? FONT_SIZE,
      font: opts.font ?? font,
      color: opts.color ?? rgb(0, 0, 0),
    })
  }

  function drawLine(yPos: number, leftX?: number, rightX?: number) {
    currentPage.drawLine({
      start: { x: leftX ?? MARGIN, y: yPos },
      end: { x: rightX ?? pageWidth - MARGIN, y: yPos },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    })
  }

  // ═══════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════
  text('SISTEMA DE GESTION JURIDICA', MARGIN, y, { font: fontBold, size: HEADER_SIZE })
  y -= 28
  text('FACTURA DE VENTA', MARGIN, y, { font, size: SUBHEADER_SIZE })
  y -= 8
  drawLine(y, MARGIN, pageWidth - MARGIN)
  y -= 18

  // ═══════════════════════════════════════════
  // INVOICE INFO — two columns
  // ═══════════════════════════════════════════
  const colLabel1 = MARGIN
  const colVal1 = MARGIN + 130
  const colLabel2 = pageWidth / 2 + 5
  const colVal2 = colLabel2 + 80

  text('Numero:', colLabel1, y, { font: fontBold, size: 10 })
  text(factura.numero, colVal1, y, { size: 10 })
  text('Estado:', colLabel2, y, { font: fontBold, size: 10 })
  text(factura.estado, colVal2, y, { size: 10 })
  y -= 16

  text('Fecha de Emision:', colLabel1, y, { font: fontBold, size: 10 })
  text(formatDate(new Date(factura.fecha)), colVal1, y, { size: 10 })
  y -= 16

  text('Fecha de Vencimiento:', colLabel1, y, { font: fontBold, size: 10 })
  text(formatDate(new Date(factura.fechaVencimiento)), colVal1, y, { size: 10 })
  y -= 10

  drawLine(y, MARGIN, pageWidth - MARGIN)
  y -= 16

  // ═══════════════════════════════════════════
  // CLIENT INFO
  // ═══════════════════════════════════════════
  text('DATOS DEL CLIENTE', MARGIN, y, { font: fontBold, size: 12 })
  y -= 20

  const clienteData = factura.honorario?.caso?.cliente || factura.cliente
  const clienteFullName = clienteData
    ? `${clienteData.nombre} ${clienteData.apellido ?? ''}`.trim()
    : factura.clienteNombre || 'No especificado'

  text('Nombre:', colLabel1, y, { font: fontBold })
  text(clienteFullName, colVal1, y)

  if (clienteData) {
    text('Documento:', colLabel2, y, { font: fontBold })
    text(clienteData.documento, colVal2, y)
    y -= 14

    text('Email:', colLabel1, y, { font: fontBold })
    text(clienteData.email, colVal1, y)
    text('Telefono:', colLabel2, y, { font: fontBold })
    text(clienteData.telefono, colVal2, y)
    y -= 14
  } else {
    y -= 14
  }

  if (factura.honorario?.caso?.numeroCaso) {
    text('Caso:', colLabel1, y, { font: fontBold })
    text(factura.honorario.caso.numeroCaso, colVal1, y)
    y -= 14
  }

  y -= 8
  drawLine(y, MARGIN, pageWidth - MARGIN)
  y -= 16

  // ═══════════════════════════════════════════
  // ITEMS TABLE
  // ═══════════════════════════════════════════
  const colDesc = MARGIN
  const colCant = MARGIN + 290
  const colUnit = MARGIN + 340
  const colTotal = MARGIN + 420

  const MAX_DESC_CHARS = 55

  function truncateDesc(desc: string): string {
    if (desc.length <= MAX_DESC_CHARS) return desc
    return desc.substring(0, MAX_DESC_CHARS - 3) + '...'
  }

  text('Descripcion', colDesc, y, { font: fontBold, size: 10 })
  text('Cant.', colCant, y, { font: fontBold, size: 10 })
  text('V. Unitario', colUnit, y, { font: fontBold, size: 10 })
  text('Total', colTotal, y, { font: fontBold, size: 10 })
  y -= 6
  currentPage.drawLine({ start: { x: MARGIN, y }, end: { x: pageWidth - MARGIN, y }, thickness: 0.5, color: rgb(0.4, 0.4, 0.4) })
  y -= 10

  for (const item of factura.items) {
    if (y < MARGIN + 120) {
      currentPage = doc.addPage(PageSizes.Letter)
      y = PAGE_HEIGHT - MARGIN
      text('Descripcion', colDesc, y, { font: fontBold, size: 10 })
      text('Cant.', colCant, y, { font: fontBold, size: 10 })
      text('V. Unitario', colUnit, y, { font: fontBold, size: 10 })
      text('Total', colTotal, y, { font: fontBold, size: 10 })
      y -= 6
      currentPage.drawLine({ start: { x: MARGIN, y }, end: { x: pageWidth - MARGIN, y }, thickness: 0.5, color: rgb(0.4, 0.4, 0.4) })
      y -= 10
    }

    text(truncateDesc(item.descripcion), colDesc, y, { size: 9 })
    text(String(item.cantidad), colCant, y, { size: 9 })
    text(formatCurrency(item.valorUnitario), colUnit, y, { size: 9 })
    text(formatCurrency(item.valorTotal), colTotal, y, { size: 9 })
    y -= 14
  }

  // ═══════════════════════════════════════════
  // TOTALS
  // ═══════════════════════════════════════════
  if (y < MARGIN + 180) {
    y = MARGIN + 180
  }

  const totLabelX = colTotal - 10
  const totValX = colTotal + 40

  drawLine(y, totLabelX)
  y -= 14

  text('Subtotal:', totLabelX, y, { font: fontBold })
  text(formatCurrency(factura.subtotal), totValX, y)
  y -= 14

  if (factura.ivaActivado) {
    text('IVA (19%):', totLabelX, y, { font: fontBold })
    text(formatCurrency(factura.impuestos), totValX, y)
  } else {
    text('IVA:', totLabelX, y, { font: fontBold })
    text('Exento', totValX, y, { color: rgb(0, 0, 0) })
  }
  y -= 8

  drawLine(y, totLabelX)
  y -= 14

  text('TOTAL:', totLabelX, y, { font: fontBold, size: 12 })
  text(formatCurrency(factura.total), totValX, y, { font: fontBold, size: 12, color: rgb(0, 0.4, 0) })
  y -= 24

  // ═══════════════════════════════════════════
  // OBSERVACIONES
  // ═══════════════════════════════════════════
  if (factura.observaciones) {
    if (y < MARGIN + 100) {
      y = MARGIN + 100
    }
    drawLine(y, MARGIN)
    y -= 14
    text('Observaciones:', MARGIN, y, { font: fontBold })
    y -= 14
    text(factura.observaciones, MARGIN + 10, y, { size: 9, color: rgb(0.3, 0.3, 0.3) })
    y -= 16
  }

  // ═══════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════
  const footerY = MARGIN + 20
  currentPage.drawLine({
    start: { x: MARGIN, y: footerY + 12 },
    end: { x: pageWidth - MARGIN, y: footerY + 12 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  })

  text('Documento generado electronicamente por el Sistema de Gestion Juridica.', MARGIN, footerY, { size: SMALL_SIZE, color: rgb(0.4, 0.4, 0.4) })

  return doc.save()
}

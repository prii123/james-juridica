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
  honorario: {
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
  }
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
const PAGE_WIDTH = PageSizes.Letter[0]
const FONT_SIZE = 9
const HEADER_SIZE = 22
const SUBHEADER_SIZE = 16
const SMALL_SIZE = 8

export async function generateFacturaPDF(factura: FacturaData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage(PageSizes.Letter)
  const { width, height } = page.getSize()

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = height - MARGIN

  function text(
    txt: string,
    x: number,
    yPos: number,
    opts: { font?: typeof font; size?: number; color?: ReturnType<typeof rgb> } = {},
  ) {
    page.drawText(txt, {
      x,
      y: yPos,
      size: opts.size ?? FONT_SIZE,
      font: opts.font ?? font,
      color: opts.color ?? rgb(0, 0, 0),
    })
  }

  // ── Header ──
  text('SISTEMA DE GESTIÓN JURÍDICA', MARGIN, y, { font: fontBold, size: HEADER_SIZE })
  y -= 28
  text('FACTURA DE VENTA', MARGIN, y, { font: font, size: SUBHEADER_SIZE })
  y -= 20

  // Separator
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 16

  // ── Invoice info (two columns) ──
  const col1X = MARGIN
  const col2X = width / 2

  text('Número:', col1X, y, { font: fontBold, size: 10 })
  text(factura.numero, col1X + 65, y, { size: 10 })
  y -= 14

  text('Fecha de Emisión:', col1X, y, { font: fontBold, size: 10 })
  text(formatDate(new Date(factura.fecha)), col1X + 65, y, { size: 10 })
  y -= 14

  text('Fecha de Vencimiento:', col1X, y, { font: fontBold, size: 10 })
  text(formatDate(new Date(factura.fechaVencimiento)), col1X + 65, y, { size: 10 })
  y -= 14

  text('Estado:', col2X, y - 28, { font: fontBold, size: 10 })
  text(factura.estado, col2X + 55, y - 28, { size: 10 })

  y -= 24

  // ── Client info ──
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 16

  text('DATOS DEL CLIENTE', MARGIN, y, { font: fontBold, size: 12 })
  y -= 20

  const fullName = `${factura.honorario.caso.cliente.nombre} ${factura.honorario.caso.cliente.apellido ?? ''}`.trim()

  text('Nombre:', col1X, y, { font: fontBold })
  text(fullName, col1X + 65, y)
  y -= 12
  text('Documento:', col1X, y, { font: fontBold })
  text(factura.honorario.caso.cliente.documento, col1X + 65, y)
  y -= 12
  text('Email:', col1X, y, { font: fontBold })
  text(factura.honorario.caso.cliente.email, col1X + 65, y)
  y -= 12
  text('Teléfono:', col1X, y, { font: fontBold })
  text(factura.honorario.caso.cliente.telefono, col1X + 65, y)
  y -= 12
  text('Caso:', col1X, y, { font: fontBold })
  text(factura.honorario.caso.numeroCaso, col1X + 65, y)

  y -= 24

  // ── Items table ──
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 14

  // Table header
  const colDescX = MARGIN
  const colQtyX = 380
  const colUnitX = 440
  const colTotalX = 500

  text('Descripción', colDescX, y, { font: fontBold, size: 10 })
  text('Cant.', colQtyX, y, { font: fontBold, size: 10 })
  text('V. Unitario', colUnitX, y, { font: fontBold, size: 10 })
  text('Total', colTotalX, y, { font: fontBold, size: 10 })
  y -= 6

  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) })
  y -= 10

  // Table rows
  for (const item of factura.items) {
    text(item.descripcion, colDescX, y, { size: 9 })
    text(String(item.cantidad), colQtyX, y, { size: 9 })
    text(formatCurrency(item.valorUnitario), colUnitX, y, { size: 9 })
    text(formatCurrency(item.valorTotal), colTotalX, y, { size: 9 })
    y -= 14
  }

  // ── Totals ──
  y = Math.max(y, MARGIN + 200)
  page.drawLine({ start: { x: 350, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 14

  text('Subtotal:', 350, y)
  text(formatCurrency(factura.subtotal), 465, y)
  y -= 14

  if (factura.ivaActivado) {
    text('IVA (19%):', 350, y)
    text(formatCurrency(factura.impuestos), 465, y)
  } else {
    text('IVA:', 350, y)
    text('Exento', 465, y)
  }
  y -= 12

  page.drawLine({ start: { x: 350, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 16

  text('TOTAL:', 350, y, { font: fontBold, size: 12 })
  text(formatCurrency(factura.total), 465, y, { font: fontBold, size: 12 })
  y -= 30

  // ── Observaciones ──
  if (factura.observaciones) {
    text('Observaciones:', MARGIN, y, { font: fontBold })
    y -= 14
    text(factura.observaciones, MARGIN, y, { size: 9 })
    y -= 20
  }

  // ── Footer ──
  const footerY = MARGIN + 20
  page.drawLine({
    start: { x: MARGIN, y: footerY + 12 },
    end: { x: width - MARGIN, y: footerY + 12 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  })

  text('Este documento es una factura de venta generada electrónicamente por el Sistema de Gestión Jurídica.', MARGIN, footerY, { size: SMALL_SIZE })

  return doc.save()
}

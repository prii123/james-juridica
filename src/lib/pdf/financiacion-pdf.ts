import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib'

interface CuotaData {
  numeroCuota: number
  fechaVencimiento: Date
  valor: number
  capital: number
  interes: number
  saldo: number
}

interface FinanciacionData {
  numeroFactura: string
  cliente: { nombre: string; apellido?: string | null; documento: string }
  caso: { numeroCaso: string }
  totalFinanciado: number
  numeroCuotas: number
  tasaInteresMensual: number
  cuotas: CuotaData[]
}

const MARGIN = 50

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export async function generateFinanciacionPDF(data: FinanciacionData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage(PageSizes.Letter)
  const { width, height } = page.getSize()

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = height - MARGIN

  function text(
    txt: string, x: number, yPos: number,
    opts: { font?: typeof font; size?: number; color?: ReturnType<typeof rgb> } = {},
  ) {
    page.drawText(txt, { x, y: yPos, size: opts.size ?? 9, font: opts.font ?? font, color: opts.color ?? rgb(0, 0, 0) })
  }

  // ── Header ──
  text('SISTEMA DE GESTIÓN JURÍDICA', MARGIN, y, { font: fontBold, size: 20 })
  y -= 24
  text('PLAN DE FINANCIACIÓN', MARGIN, y, { font: fontBold, size: 15 })
  y -= 14
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 18

  // ── Info block ──
  const fullName = `${data.cliente.nombre} ${data.cliente.apellido ?? ''}`.trim()

  text('Factura:', MARGIN, y, { font: fontBold, size: 10 })
  text(data.numeroFactura, MARGIN + 55, y, { size: 10 })
  y -= 13
  text('Cliente:', MARGIN, y, { font: fontBold, size: 10 })
  text(fullName, MARGIN + 55, y, { size: 10 })
  y -= 13
  text('Documento:', MARGIN, y, { font: fontBold, size: 10 })
  text(data.cliente.documento, MARGIN + 55, y, { size: 10 })
  y -= 13
  text('Caso:', MARGIN, y, { font: fontBold, size: 10 })
  text(data.caso.numeroCaso, MARGIN + 55, y, { size: 10 })
  y -= 13
  text('Total Financiado:', MARGIN, y, { font: fontBold, size: 10 })
  text(formatCurrency(data.totalFinanciado), MARGIN + 55, y, { size: 10 })
  y -= 13
  text('Número de Cuotas:', MARGIN, y, { font: fontBold, size: 10 })
  text(String(data.numeroCuotas), MARGIN + 55, y, { size: 10 })
  y -= 13
  text('Tasa de Interés Mensual:', MARGIN, y, { font: fontBold, size: 10 })
  text(`${data.tasaInteresMensual}%`, MARGIN + 55, y, { size: 10 })
  y -= 24

  // ── Amortization table ──
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 14

  const colN = MARGIN
  const colDate = 120
  const colValor = 210
  const colCapital = 310
  const colInteres = 400
  const colSaldo = 490

  text('N°', colN, y, { font: fontBold, size: 10 })
  text('Fecha Venc.', colDate, y, { font: fontBold, size: 10 })
  text('Valor Cuota', colValor, y, { font: fontBold, size: 10 })
  text('Capital', colCapital, y, { font: fontBold, size: 10 })
  text('Interés', colInteres, y, { font: fontBold, size: 10 })
  text('Saldo', colSaldo, y, { font: fontBold, size: 10 })
  y -= 6

  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) })
  y -= 10

  for (const cuota of data.cuotas) {
    text(String(cuota.numeroCuota), colN, y, { size: 9 })
    text(formatDate(cuota.fechaVencimiento), colDate, y, { size: 9 })
    text(formatCurrency(cuota.valor), colValor, y, { size: 9 })
    text(formatCurrency(cuota.capital), colCapital, y, { color: rgb(0, 0.4, 0), size: 9 })
    text(formatCurrency(cuota.interes), colInteres, y, { color: rgb(0.7, 0.5, 0), size: 9 })
    text(formatCurrency(cuota.saldo), colSaldo, y, { size: 9 })
    y -= 13
  }

  // ── Totals ──
  y = Math.max(y, MARGIN + 180)
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 14

  const totalCapital = data.cuotas.reduce((s, c) => s + c.capital, 0)
  const totalInteres = data.cuotas.reduce((s, c) => s + c.interes, 0)
  const totalPagar = data.cuotas.reduce((s, c) => s + c.valor, 0)
  const labelX = 280
  const valueX = 420

  text('Total Capital:', labelX, y, { font: fontBold })
  text(formatCurrency(totalCapital), valueX, y, { size: 9 })
  y -= 13
  text('Total Intereses:', labelX, y, { font: fontBold })
  text(formatCurrency(totalInteres), valueX, y, { size: 9, color: rgb(0.7, 0.5, 0) })
  y -= 4
  page.drawLine({ start: { x: labelX, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 14
  text('TOTAL A PAGAR:', labelX, y, { font: fontBold, size: 12 })
  text(formatCurrency(totalPagar), valueX, y, { font: fontBold, size: 12, color: rgb(0, 0.4, 0) })
  y -= 30

  // ── Footer ──
  const footerY = MARGIN + 20
  page.drawLine({ start: { x: MARGIN, y: footerY + 12 }, end: { x: width - MARGIN, y: footerY + 12 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  text('Documento generado electrónicamente por el Sistema de Gestión Jurídica.', MARGIN, footerY, { size: 8 })

  return doc.save()
}

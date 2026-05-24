import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb, PageSizes } from 'pdf-lib'

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
const ROW_HEIGHT = 13
const CUOTAS_PER_PAGE = 30

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

function drawHeader(
  page: PDFPage,
  width: number,
  font: PDFFont,
  fontBold: PDFFont,
): number {
  let y = page.getSize().height - MARGIN

  page.drawText('SISTEMA DE GESTIÓN JURÍDICA', { x: MARGIN, y, size: 20, font: fontBold })
  y -= 24
  page.drawText('PLAN DE FINANCIACIÓN', { x: MARGIN, y, size: 15, font: fontBold })
  y -= 14
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 18

  return y
}

function drawInfoBlock(
  page: PDFPage,
  width: number,
  y: number,
  data: FinanciacionData,
  font: PDFFont,
  fontBold: PDFFont,
): number {
  const fullName = `${data.cliente.nombre} ${data.cliente.apellido ?? ''}`.trim()

  const labelX = MARGIN + 10
  const valueX = MARGIN + 160
  const lineHeight = 15

  page.drawText('Factura:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(data.numeroFactura, { x: valueX, y, size: 10, font })
  y -= lineHeight

  page.drawText('Cliente:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(fullName, { x: valueX, y, size: 10, font })
  y -= lineHeight

  page.drawText('Documento:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(data.cliente.documento, { x: valueX, y, size: 10, font })
  y -= lineHeight

  page.drawText('Caso:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(data.caso.numeroCaso, { x: valueX, y, size: 10, font })
  y -= lineHeight

  page.drawText('Total Financiado:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(formatCurrency(data.totalFinanciado), { x: valueX, y, size: 10, font })
  y -= lineHeight

  page.drawText('Número de Cuotas:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(String(data.numeroCuotas), { x: valueX, y, size: 10, font })
  y -= lineHeight

  page.drawText('Tasa de Interés Mensual:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(`${data.tasaInteresMensual}%`, { x: valueX, y, size: 10, font })
  y -= 28

  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 14

  return y
}

function drawTableHeader(
  page: PDFPage,
  width: number,
  y: number,
  font: PDFFont,
  fontBold: PDFFont,
): number {
  const colN = MARGIN
  const colDate = 80
  const colValor = 145
  const colCapital = 230
  const colInteres = 340
  const colSaldo = 450

  page.drawText('N°', { x: colN, y, size: 10, font: fontBold })
  page.drawText('Vencimiento', { x: colDate, y, size: 10, font: fontBold })
  page.drawText('Cuota', { x: colValor, y, size: 10, font: fontBold })
  page.drawText('Capital', { x: colCapital, y, size: 10, font: fontBold })
  page.drawText('Interés', { x: colInteres, y, size: 10, font: fontBold })
  page.drawText('Saldo', { x: colSaldo, y, size: 10, font: fontBold })
  y -= 6

  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) })
  y -= 10

  return y
}

function drawFooter(page: PDFPage, width: number, font: PDFFont) {
  const footerY = MARGIN + 20
  page.drawLine({
    start: { x: MARGIN, y: footerY + 12 },
    end: { x: width - MARGIN, y: footerY + 12 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  })
  page.drawText('Documento generado electrónicamente por el Sistema de Gestión Jurídica.', {
    x: MARGIN,
    y: footerY,
    size: 8,
    font,
  })
}

function drawCuotaRow(page: PDFPage, cuota: CuotaData, y: number, font: PDFFont) {
  const colN = MARGIN
  const colDate = 80
  const colValor = 145
  const colCapital = 230
  const colInteres = 340
  const colSaldo = 450

  page.drawText(String(cuota.numeroCuota), { x: colN, y, size: 9, font })
  page.drawText(formatDate(cuota.fechaVencimiento), { x: colDate, y, size: 9, font })
  page.drawText(formatCurrency(cuota.valor), { x: colValor, y, size: 9, font })
  page.drawText(formatCurrency(cuota.capital), { x: colCapital, y, size: 9, font, color: rgb(0, 0.4, 0) })
  page.drawText(formatCurrency(cuota.interes), { x: colInteres, y, size: 9, font, color: rgb(0.7, 0.5, 0) })
  page.drawText(formatCurrency(cuota.saldo), { x: colSaldo, y, size: 9, font })
}

export async function generateFinanciacionPDF(data: FinanciacionData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const totalCapital = data.cuotas.reduce((s, c) => s + c.capital, 0)
  const totalInteres = data.cuotas.reduce((s, c) => s + c.interes, 0)
  const totalPagar = data.cuotas.reduce((s, c) => s + c.valor, 0)

  let currentPage = doc.addPage(PageSizes.Letter)
  const pageWidth = currentPage.getSize().width
  const footerReserve = 50
  let y = drawHeader(currentPage, pageWidth, font, fontBold)
  y = drawInfoBlock(currentPage, pageWidth, y, data, font, fontBold)
  y = drawTableHeader(currentPage, pageWidth, y, font, fontBold)
  let rowsOnPage = 0

  function newPage(): void {
    drawFooter(currentPage, pageWidth, font)
    currentPage = doc.addPage(PageSizes.Letter)
    y = drawTableHeader(currentPage, pageWidth, currentPage.getSize().height - MARGIN, font, fontBold)
    rowsOnPage = 0
  }

  for (let i = 0; i < data.cuotas.length; i++) {
    if (rowsOnPage >= CUOTAS_PER_PAGE || y - ROW_HEIGHT < MARGIN + footerReserve) {
      newPage()
    }

    drawCuotaRow(currentPage, data.cuotas[i], y, font)
    y -= ROW_HEIGHT
    rowsOnPage++
  }

  const footerAbsoluteY = MARGIN + 20
  const totalsNeededHeight = 80

  if (y - totalsNeededHeight < footerAbsoluteY) {
    newPage()
  }

  const pw = currentPage.getSize().width

  currentPage.drawLine({
    start: { x: MARGIN, y },
    end: { x: pw - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  })
  y -= 14

  const labelX = 280
  const valueX = 420

  currentPage.drawText('Total Capital:', { x: labelX, y, size: 9, font: fontBold })
  currentPage.drawText(formatCurrency(totalCapital), { x: valueX, y, size: 9, font })
  y -= 13

  currentPage.drawText('Total Intereses:', { x: labelX, y, size: 9, font: fontBold })
  currentPage.drawText(formatCurrency(totalInteres), { x: valueX, y, size: 9, font, color: rgb(0.7, 0.5, 0) })
  y -= 4

  currentPage.drawLine({
    start: { x: labelX, y },
    end: { x: pw - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  })
  y -= 14

  currentPage.drawText('TOTAL A PAGAR:', { x: labelX, y, size: 12, font: fontBold })
  currentPage.drawText(formatCurrency(totalPagar), { x: valueX, y, size: 12, font: fontBold, color: rgb(0, 0.4, 0) })

  drawFooter(currentPage, pw, font)

  return doc.save()
}

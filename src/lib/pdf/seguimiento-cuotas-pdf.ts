import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb, PageSizes } from 'pdf-lib'

interface PagoAplicadoData {
  valorAplicado: number
  fechaAplicacion: string
  pago: {
    id: string
    valor: number
    fecha: string
    metodoPago: string
    referencia?: string | null
    observaciones?: string | null
  }
}

interface CuotaSeguimientoData {
  numeroCuota: number
  valor: number
  capital: number
  interes: number
  saldo: number
  fechaVencimiento: string
  fechaPago?: string
  estado: string
  valorPagado: number
  saldoCuota: number
  diasVencido: number
  pagosAplicados: PagoAplicadoData[]
}

interface PagoHistorialData {
  id: string
  valor: number
  fecha: string
  metodoPago: string
  referencia?: string | null
  observaciones?: string | null
  distribucion: {
    cuotaNumero: number
    valorAplicado: number
    fechaAplicacion: string
  }[]
}

interface SeguimientoPDFData {
  factura: {
    numero: string
    fecha: string
    total: number
    modalidadPago: string
    numeroCuotas?: number
    valorCuota?: number
    tasaInteres?: number
    cliente: {
      nombre: string
      apellido?: string
    }
    caso: {
      numeroCaso: string
    }
  }
  resumen: {
    totalPagado: number
    saldoPendiente: number
    cuotasPagadas: number
    cuotasVencidas: number
    cuotasParciales: number
    cuotasPendientes: number
    progresoPago: number
  }
  cuotas: CuotaSeguimientoData[]
  historialPagos: PagoHistorialData[]
}

const MARGIN = 50
const ROW_HEIGHT = 13
const CUOTAS_PER_PAGE = 28

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function getEstadoLabel(estado: string): string {
  switch (estado) {
    case 'PAGADA': return 'Pagada'
    case 'VENCIDA': return 'Vencida'
    case 'PARCIAL': return 'Parcial'
    default: return 'Pendiente'
  }
}

function drawPageHeader(page: PDFPage, width: number, font: PDFFont, fontBold: PDFFont): number {
  let y = page.getSize().height - MARGIN

  page.drawText('SISTEMA DE GESTION JURIDICA', { x: MARGIN, y, size: 20, font: fontBold })
  y -= 24
  page.drawText('INFORME DE SEGUIMIENTO DE CUOTAS', { x: MARGIN, y, size: 15, font: fontBold })
  y -= 14
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 18
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
  page.drawText('Documento generado electronicamente por el Sistema de Gestion Juridica.', {
    x: MARGIN, y: footerY, size: 8, font,
  })
}

function drawFacturaInfo(page: PDFPage, width: number, y: number, data: SeguimientoPDFData, font: PDFFont, fontBold: PDFFont): number {
  const f = data.factura
  const clienteFull = `${f.cliente.nombre} ${f.cliente.apellido ?? ''}`.trim()
  const labelX = MARGIN + 10
  const col2X = 300
  const lineH = 14

  page.drawText('Factura:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(f.numero, { x: labelX + 80, y, size: 10, font })
  page.drawText('Cliente:', { x: col2X, y, size: 10, font: fontBold })
  page.drawText(clienteFull, { x: col2X + 60, y, size: 10, font })
  y -= lineH

  page.drawText('Fecha:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(formatDate(f.fecha), { x: labelX + 80, y, size: 10, font })
  page.drawText('Caso:', { x: col2X, y, size: 10, font: fontBold })
  page.drawText(f.caso.numeroCaso, { x: col2X + 60, y, size: 10, font })
  y -= lineH

  page.drawText('Total Factura:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(formatCurrency(f.total), { x: labelX + 80, y, size: 10, font })
  page.drawText('Modalidad:', { x: col2X, y, size: 10, font: fontBold })
  page.drawText(f.modalidadPago === 'FINANCIADO' ? 'Financiado' : 'Contado', { x: col2X + 60, y, size: 10, font })
  y -= lineH

  if (f.numeroCuotas) {
    page.drawText('Cuotas:', { x: labelX, y, size: 10, font: fontBold })
    page.drawText(`${f.numeroCuotas} cuotas`, { x: labelX + 80, y, size: 10, font })
    page.drawText('Tasa Interes:', { x: col2X, y, size: 10, font: fontBold })
    page.drawText(`${f.tasaInteres ?? 0}% mensual`, { x: col2X + 60, y, size: 10, font })
    y -= lineH
  }

  if (f.valorCuota) {
    page.drawText('Valor Cuota:', { x: labelX, y, size: 10, font: fontBold })
    page.drawText(formatCurrency(f.valorCuota), { x: labelX + 80, y, size: 10, font })
    y -= lineH
  }

  y -= 6
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 14
  return y
}

function drawResumen(page: PDFPage, width: number, y: number, data: SeguimientoPDFData, font: PDFFont, fontBold: PDFFont): number {
  const r = data.resumen

  page.drawText('RESUMEN DE PAGOS', { x: MARGIN, y, size: 12, font: fontBold })
  y -= 16

  const lineH = 13
  const labelX = MARGIN + 10
  const valX = labelX + 110

  page.drawText('Progreso de pago:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(formatPercent(r.progresoPago), { x: valX, y, size: 10, font, color: rgb(0, 0.4, 0) })
  y -= lineH

  page.drawText('Total pagado:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(formatCurrency(r.totalPagado), { x: valX, y, size: 10, font, color: rgb(0, 0.4, 0) })
  y -= lineH

  page.drawText('Saldo pendiente:', { x: labelX, y, size: 10, font: fontBold })
  page.drawText(formatCurrency(r.saldoPendiente), { x: valX, y, size: 10, font, color: rgb(0.7, 0.5, 0) })
  y -= lineH

  y -= 6

  page.drawText('ESTADO DE CUOTAS', { x: MARGIN, y, size: 12, font: fontBold })
  y -= 14
  page.drawText(`Pagadas: ${r.cuotasPagadas}`, { x: labelX, y, size: 10, font, color: rgb(0, 0.4, 0) })
  page.drawText(`Vencidas: ${r.cuotasVencidas}`, { x: labelX + 100, y, size: 10, font, color: rgb(0.8, 0, 0) })
  page.drawText(`Parciales: ${r.cuotasParciales}`, { x: labelX + 200, y, size: 10, font, color: rgb(0, 0.6, 0.8) })
  page.drawText(`Pendientes: ${r.cuotasPendientes}`, { x: labelX + 300, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
  y -= 10

  y -= 6
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 14
  return y
}

function drawCuotasTableHeader(page: PDFPage, y: number, font: PDFFont, fontBold: PDFFont): number {
  const colN = MARGIN
  const colFecha = 75
  const colValor = 138
  const colCapital = 200
  const colInteres = 262
  const colPagado = 320
  const colSaldo = 378
  const colEstado = 440
  const colProg = 500

  page.drawText('N', { x: colN, y, size: 9, font: fontBold })
  page.drawText('Vencimiento', { x: colFecha, y, size: 9, font: fontBold })
  page.drawText('Cuota', { x: colValor, y, size: 9, font: fontBold })
  page.drawText('Capital', { x: colCapital, y, size: 9, font: fontBold })
  page.drawText('Interes', { x: colInteres, y, size: 9, font: fontBold })
  page.drawText('Pagado', { x: colPagado, y, size: 9, font: fontBold })
  page.drawText('Saldo', { x: colSaldo, y, size: 9, font: fontBold })
  page.drawText('Estado', { x: colEstado, y, size: 9, font: fontBold })
  page.drawText('%', { x: colProg, y, size: 9, font: fontBold })
  y -= 4

  page.drawLine({ start: { x: MARGIN, y }, end: { x: page.getSize().width - MARGIN, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) })
  y -= 9
  return y
}

function drawCuotaRow(page: PDFPage, cuota: CuotaSeguimientoData, y: number, font: PDFFont) {
  const colN = MARGIN
  const colFecha = 75
  const colValor = 138
  const colCapital = 200
  const colInteres = 262
  const colPagado = 320
  const colSaldo = 378
  const colEstado = 440
  const colProg = 500

  const prog = cuota.valor > 0 ? ((cuota.valorPagado / cuota.valor) * 100) : 0
  const colorEstado = cuota.estado === 'PAGADA' ? rgb(0, 0.4, 0)
    : cuota.estado === 'VENCIDA' ? rgb(0.8, 0, 0)
    : cuota.estado === 'PARCIAL' ? rgb(0, 0.6, 0.8)
    : rgb(0.5, 0.5, 0.5)

  page.drawText(String(cuota.numeroCuota), { x: colN, y, size: 9, font })
  page.drawText(formatDate(cuota.fechaVencimiento), { x: colFecha, y, size: 9, font })
  page.drawText(formatCurrency(cuota.valor), { x: colValor, y, size: 9, font })
  page.drawText(formatCurrency(cuota.capital), { x: colCapital, y, size: 9, font })
  page.drawText(formatCurrency(cuota.interes), { x: colInteres, y, size: 9, font })
  page.drawText(cuota.valorPagado > 0 ? formatCurrency(cuota.valorPagado) : '-', { x: colPagado, y, size: 9, font })
  page.drawText(cuota.saldoCuota > 0 ? formatCurrency(cuota.saldoCuota) : '-', { x: colSaldo, y, size: 9, font })
  page.drawText(getEstadoLabel(cuota.estado), { x: colEstado, y, size: 9, font, color: colorEstado })
  page.drawText(formatPercent(prog), { x: colProg, y, size: 9, font })
}

function drawCuotaPayments(page: PDFPage, y: number, cuota: CuotaSeguimientoData, font: PDFFont, fontBold: PDFFont): number {
  if (cuota.pagosAplicados.length === 0) return y

  const indent = MARGIN + 10
  y -= 2
  page.drawText(`Pagos cuota #${cuota.numeroCuota}:`, { x: indent, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 10

  for (const ap of cuota.pagosAplicados) {
    page.drawText(`  ${formatDate(ap.fechaAplicacion)} - ${formatCurrency(ap.valorAplicado)} (${ap.pago.metodoPago})`,
      { x: indent + 10, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
    y -= 11
  }
  y -= 2
  return y
}

export async function generateSeguimientoCuotasPDF(data: SeguimientoPDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const pageWidth = PageSizes.Letter[0]
  const footerReserve = 50
  let currentPage = doc.addPage(PageSizes.Letter)
  let y = drawPageHeader(currentPage, pageWidth, font, fontBold)
  y = drawFacturaInfo(currentPage, pageWidth, y, data, font, fontBold)
  y = drawResumen(currentPage, pageWidth, y, data, font, fontBold)

  y = drawCuotasTableHeader(currentPage, y, font, fontBold)
  let rowsOnPage = 0

  function newPageForCuotas(): void {
    drawFooter(currentPage, pageWidth, font)
    currentPage = doc.addPage(PageSizes.Letter)
    y = drawCuotasTableHeader(currentPage, currentPage.getSize().height - MARGIN, font, fontBold)
    rowsOnPage = 0
  }

  for (const cuota of data.cuotas) {
    if (rowsOnPage >= CUOTAS_PER_PAGE || y - ROW_HEIGHT < MARGIN + footerReserve) {
      newPageForCuotas()
    }

    drawCuotaRow(currentPage, cuota, y, font)
    y -= ROW_HEIGHT
    rowsOnPage++

    const paymentsHeight = cuota.pagosAplicados.length * 11 + 12
    if (cuota.pagosAplicados.length > 0 && y - paymentsHeight > MARGIN + footerReserve) {
      y = drawCuotaPayments(currentPage, y, cuota, font, fontBold)
      rowsOnPage += cuota.pagosAplicados.length
    }
  }

  // Historial de pagos section
  const footerY = MARGIN + 20
  const paymentsEstimate = data.historialPagos.length * 50 + 80
  if (y - paymentsEstimate < footerY + 40) {
    drawFooter(currentPage, pageWidth, font)
    currentPage = doc.addPage(PageSizes.Letter)
    y = currentPage.getSize().height - MARGIN
  }

  const pw = currentPage.getSize().width

  currentPage.drawLine({ start: { x: MARGIN, y }, end: { x: pw - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 16

  currentPage.drawText('HISTORIAL DE PAGOS', { x: MARGIN, y, size: 12, font: fontBold })
  y -= 14

  if (data.historialPagos.length === 0) {
    currentPage.drawText('No hay pagos registrados.', { x: MARGIN + 10, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
    y -= 16
  } else {
    currentPage.drawText(`${data.historialPagos.length} pago(s) registrado(s)`, { x: MARGIN + 10, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 16
  }

  function newPageForPayments(): void {
    drawFooter(currentPage, pageWidth, font)
    currentPage = doc.addPage(PageSizes.Letter)
    y = currentPage.getSize().height - MARGIN
  }

  for (const pago of data.historialPagos) {
    const pagoHeight = 18 + pago.distribucion.length * 10 + 6
    if (y - pagoHeight < footerY) {
      newPageForPayments()
    }

    const boxX = MARGIN + 5
    currentPage.drawRectangle({
      x: boxX, y: y - 4, width: pw - MARGIN * 2 - 10, height: 22,
      borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.5
    })
    currentPage.drawText(formatDate(pago.fecha), { x: boxX + 5, y, size: 10, font: fontBold })
    currentPage.drawText(formatCurrency(pago.valor), { x: boxX + 100, y, size: 10, font, color: rgb(0, 0.4, 0) })
    currentPage.drawText(pago.metodoPago.replace(/_/g, ' '), { x: boxX + 220, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
    if (pago.referencia) {
      currentPage.drawText(`Ref: ${pago.referencia}`, { x: boxX + 340, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
    }
    y -= 18

    for (const dist of pago.distribucion) {
      currentPage.drawText(`  Cuota #${dist.cuotaNumero}: ${formatCurrency(dist.valorAplicado)}`,
        { x: boxX + 10, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
      y -= 10
    }
    y -= 4
  }

  if (data.historialPagos.length > 0 && y - 20 > footerY) {
    const totalPagado = data.historialPagos.reduce((sum, p) => sum + p.valor, 0)
    y -= 4
    currentPage.drawLine({ start: { x: 380, y }, end: { x: pw - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    y -= 14
    currentPage.drawText('TOTAL PAGADO:', { x: 380, y, size: 10, font: fontBold })
    currentPage.drawText(formatCurrency(totalPagado), { x: 470, y, size: 10, font: fontBold, color: rgb(0, 0.4, 0) })
  }

  drawFooter(currentPage, pw, font)
  return doc.save()
}

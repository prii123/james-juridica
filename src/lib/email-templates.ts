function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const baseStyles = `
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
  .header { background: #1a237e; color: #fff; padding: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 20px; }
  .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.8; }
  .content { padding: 24px; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .info-table td { padding: 6px 0; font-size: 13px; }
  .info-table .label { color: #666; width: 140px; }
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .items-table th { background: #e8eaf6; padding: 8px 10px; text-align: left; font-size: 12px; color: #283593; }
  .items-table td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
  .items-table .right { text-align: right; }
  .totals { margin-top: 12px; text-align: right; }
  .totals div { margin-bottom: 4px; font-size: 13px; }
  .totals .grand-total { font-size: 18px; color: #2e7d32; font-weight: bold; margin-top: 8px; padding-top: 8px; border-top: 2px solid #2e7d32; }
  .footer { padding: 16px 24px; background: #fafafa; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
  .badge-pendiente { background: #fff3e0; color: #e65100; }
  .badge-pagada { background: #e8f5e9; color: #2e7d32; }
  .badge-vencida { background: #ffebee; color: #c62828; }
  .badge-parcial { background: #e3f2fd; color: #1565c0; }
  .section-title { font-size: 16px; color: #1a237e; margin: 20px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #e8eaf6; }
`

interface FacturaEmailData {
  numeroFactura: string
  clienteNombre: string
  fecha: string
  fechaVencimiento: string
  estado: string
  total: number
  subtotal: number
  impuestos: number
  ivaActivado: boolean
  casoNumero?: string
  observaciones?: string | null
  items: { descripcion: string; cantidad: number; valorUnitario: number; valorTotal: number }[]
}

export function facturaEmailHTML(data: FacturaEmailData): string {
  const itemsRows = data.items
    .map(
      (item) => `
    <tr>
      <td>${item.descripcion}</td>
      <td class="right">${item.cantidad}</td>
      <td class="right">${formatCurrency(item.valorUnitario)}</td>
      <td class="right">${formatCurrency(item.valorTotal)}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html><html><head><style>${baseStyles}</style></head><body>
  <div class="container">
    <div class="header">
      <h1>FACTURA DE VENTA</h1>
      <p>Sistema de Gestion Juridica</p>
    </div>
    <div class="content">
      <h2 style="margin:0 0 16px;color:#1a237e;font-size:18px;">${data.numeroFactura}</h2>
      <table class="info-table">
        <tr><td class="label">Cliente:</td><td><strong>${data.clienteNombre}</strong>${data.casoNumero ? ` &middot; Caso ${data.casoNumero}` : ''}</td></tr>
        <tr><td class="label">Fecha Emision:</td><td>${formatDate(data.fecha)}</td></tr>
        <tr><td class="label">Fecha Vencimiento:</td><td>${formatDate(data.fechaVencimiento)}</td></tr>
        <tr><td class="label">Estado:</td><td><span class="badge badge-pendiente">${data.estado}</span></td></tr>
      </table>

      <table class="items-table">
        <thead><tr><th>Descripcion</th><th class="right">Cant.</th><th class="right">V. Unitario</th><th class="right">Total</th></tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>

      <div class="totals">
        <div>Subtotal: ${formatCurrency(data.subtotal)}</div>
        <div>IVA${data.ivaActivado ? ' (19%)' : ''}: ${data.ivaActivado ? formatCurrency(data.impuestos) : 'Exento'}</div>
        <div class="grand-total">TOTAL: ${formatCurrency(data.total)}</div>
      </div>

      ${data.observaciones ? `<div style="margin-top:20px;padding:12px;background:#f5f5f5;border-radius:4px;font-size:13px;color:#555;"><strong>Observaciones:</strong><br>${data.observaciones}</div>` : ''}
    </div>
    <div class="footer">Documento generado electronicamente por el Sistema de Gestion Juridica.<br>Este correo fue enviado automaticamente. No responda a este mensaje.</div>
  </div>
  </body></html>`
}

interface CuotaAmortizacion {
  numero: number
  fechaVencimiento: string
  valorCuota: number
  capital: number
  interes: number
  saldo: number
}

interface FinanciacionEmailData {
  numeroFactura: string
  clienteNombre: string
  totalFinanciado: number
  numeroCuotas: number
  tasaInteresMensual: number
  cuotas: CuotaAmortizacion[]
}

export function financiacionEmailHTML(data: FinanciacionEmailData): string {
  const totalIntereses = data.cuotas.reduce((s, c) => s + c.interes, 0)
  const totalPagar = data.cuotas.reduce((s, c) => s + c.valorCuota, 0)

  const cuotasRows = data.cuotas
    .map(
      (c) => `
    <tr>
      <td><span class="badge badge-parcial">#${c.numero}</span></td>
      <td>${formatDate(c.fechaVencimiento)}</td>
      <td class="right">${formatCurrency(c.valorCuota)}</td>
      <td class="right">${formatCurrency(c.capital)}</td>
      <td class="right">${formatCurrency(c.interes)}</td>
      <td class="right">${formatCurrency(c.saldo)}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html><html><head><style>${baseStyles}</style></head><body>
  <div class="container">
    <div class="header">
      <h1>PLAN DE FINANCIACION</h1>
      <p>Sistema de Gestion Juridica</p>
    </div>
    <div class="content">
      <table class="info-table">
        <tr><td class="label">Factura:</td><td><strong>${data.numeroFactura}</strong></td></tr>
        <tr><td class="label">Cliente:</td><td><strong>${data.clienteNombre}</strong></td></tr>
        <tr><td class="label">Total Financiado:</td><td><strong>${formatCurrency(data.totalFinanciado)}</strong></td></tr>
        <tr><td class="label">Cuotas:</td><td>${data.numeroCuotas} cuotas</td></tr>
        <tr><td class="label">Tasa Interes:</td><td>${data.tasaInteresMensual}% mensual</td></tr>
      </table>

      <div class="section-title">Tabla de Amortizacion</div>
      <table class="items-table">
        <thead><tr><th>Cuota</th><th>Vencimiento</th><th class="right">Valor</th><th class="right">Capital</th><th class="right">Interes</th><th class="right">Saldo</th></tr></thead>
        <tbody>${cuotasRows}</tbody>
      </table>
      <div class="totals">
        <div>Capital: ${formatCurrency(data.totalFinanciado)}</div>
        <div>Intereses: ${formatCurrency(totalIntereses)}</div>
        <div class="grand-total">TOTAL A PAGAR: ${formatCurrency(totalPagar)}</div>
      </div>
    </div>
    <div class="footer">Documento generado electronicamente por el Sistema de Gestion Juridica.<br>Este correo fue enviado automaticamente. No responda a este mensaje.</div>
  </div>
  </body></html>`
}

interface CuotaSeguimientoEmail {
  numeroCuota: number
  valor: number
  capital: number
  interes: number
  fechaVencimiento: string
  estado: string
  valorPagado: number
  saldoCuota: number
  diasVencido: number
}

interface SeguimientoCuotasEmailData {
  numeroFactura: string
  clienteNombre: string
  total: number
  numeroCuotas: number
  progresoPago: number
  totalPagado: number
  saldoPendiente: number
  cuotas: CuotaSeguimientoEmail[]
}

function estadoBadge(estado: string, diasVencido: number): string {
  switch (estado) {
    case 'PAGADA':
      return '<span class="badge badge-pagada">Pagada</span>'
    case 'VENCIDA':
      return `<span class="badge badge-vencida">Vencida (${diasVencido}d)</span>`
    case 'PARCIAL':
      return '<span class="badge badge-parcial">Parcial</span>'
    default:
      return '<span class="badge badge-pendiente">Pendiente</span>'
  }
}

export function seguimientoCuotasEmailHTML(data: SeguimientoCuotasEmailData): string {
  const cuotasRows = data.cuotas
    .map(
      (c) => `
    <tr>
      <td>#${c.numeroCuota}</td>
      <td>${formatDate(c.fechaVencimiento)}</td>
      <td class="right">${formatCurrency(c.valor)}</td>
      <td class="right">${c.valorPagado > 0 ? formatCurrency(c.valorPagado) : '-'}</td>
      <td class="right">${c.saldoCuota > 0 ? formatCurrency(c.saldoCuota) : '-'}</td>
      <td>${estadoBadge(c.estado, c.diasVencido)}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html><html><head><style>${baseStyles}</style></head><body>
  <div class="container">
    <div class="header">
      <h1>ESTADO DE CUENTA</h1>
      <p>Sistema de Gestion Juridica</p>
    </div>
    <div class="content">
      <table class="info-table">
        <tr><td class="label">Factura:</td><td><strong>${data.numeroFactura}</strong></td></tr>
        <tr><td class="label">Cliente:</td><td><strong>${data.clienteNombre}</strong></td></tr>
        <tr><td class="label">Total Factura:</td><td><strong>${formatCurrency(data.total)}</strong></td></tr>
        <tr><td class="label">Progreso:</td><td><strong>${data.progresoPago.toFixed(1)}%</strong></td></tr>
      </table>

      <div style="display:flex;gap:16px;margin:16px 0;">
        <div style="flex:1;padding:12px;background:#e8f5e9;border-radius:4px;text-align:center;">
          <div style="font-size:20px;color:#2e7d32;font-weight:bold;">${formatCurrency(data.totalPagado)}</div>
          <div style="font-size:11px;color:#666;">Pagado</div>
        </div>
        <div style="flex:1;padding:12px;background:#fff3e0;border-radius:4px;text-align:center;">
          <div style="font-size:20px;color:#e65100;font-weight:bold;">${formatCurrency(data.saldoPendiente)}</div>
          <div style="font-size:11px;color:#666;">Pendiente</div>
        </div>
      </div>

      <div class="section-title">Estado de Cuotas (${data.numeroCuotas} cuotas)</div>
      <table class="items-table">
        <thead><tr><th>Cuota</th><th>Vencimiento</th><th class="right">Valor</th><th class="right">Pagado</th><th class="right">Saldo</th><th>Estado</th></tr></thead>
        <tbody>${cuotasRows}</tbody>
      </table>
    </div>
    <div class="footer">Documento generado electronicamente por el Sistema de Gestion Juridica.<br>Este correo fue enviado automaticamente. No responda a este mensaje.</div>
  </div>
  </body></html>`
}

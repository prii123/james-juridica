interface CuotaCalculada {
  numeroCuota: number
  fechaVencimiento: Date
  valor: number
  capital: number
  interes: number
  saldo: number
}

export function calcularCuotas(
  monto: number,
  numeroCuotas: number,
  tasaInteresMensual: number,
  fechaInicio: Date,
): CuotaCalculada[] {
  const tasaMensual = tasaInteresMensual / 100

  let valorCuota = 0
  if (tasaMensual > 0) {
    const factor = Math.pow(1 + tasaMensual, numeroCuotas)
    valorCuota = (monto * tasaMensual * factor) / (factor - 1)
  } else {
    valorCuota = monto / numeroCuotas
  }

  const tabla: CuotaCalculada[] = []
  let saldoPendiente = monto

  for (let i = 1; i <= numeroCuotas; i++) {
    const interes = saldoPendiente * tasaMensual
    const capital = valorCuota - interes
    saldoPendiente -= capital

    const fechaVencimiento = new Date(fechaInicio)
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i)

    tabla.push({
      numeroCuota: i,
      fechaVencimiento,
      valor: Math.round(valorCuota),
      capital: Math.round(capital),
      interes: Math.round(interes),
      saldo: Math.round(Math.max(0, saldoPendiente)),
    })
  }

  return tabla
}

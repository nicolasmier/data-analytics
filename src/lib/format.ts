const eur = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

const num = new Intl.NumberFormat('es-ES')

export function formatEuro(value: number): string {
  return eur.format(value)
}

export function formatNumber(value: number): string {
  return num.format(value)
}

import type { Inscripcion } from '../../domain/types'
import { resumen } from '../../domain/metrics'
import { formatEuro, formatNumber } from '../../lib/format'

export function KpiGrid({ rows }: { rows: Inscripcion[] }) {
  const r = resumen(rows)
  const cards = [
    { label: 'Inscripciones', value: formatNumber(r.inscripciones) },
    { label: 'Carreras (ediciones)', value: formatNumber(r.carreras) },
    { label: 'Corredores únicos', value: formatNumber(r.corredoresUnicos) },
    { label: 'Recaudación', value: formatEuro(r.recaudacion) },
    { label: 'Ticket medio', value: formatEuro(r.ticketMedio) },
  ]

  return (
    <div className="stat-grid">
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <span className="stat-value">{card.value}</span>
          <span className="stat-label">{card.label}</span>
        </div>
      ))}
    </div>
  )
}

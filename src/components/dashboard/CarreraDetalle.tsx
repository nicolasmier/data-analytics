import {
  comparativaVsGlobal,
  desglosePruebas,
  resumen,
  type CarreraRank,
} from '../../domain/metrics'
import type { Inscripcion } from '../../domain/types'
import { formatEuro, formatNumber } from '../../lib/format'
import { ProcedenciaChart } from './ProcedenciaChart'

const ETIQUETAS: Record<string, string> = {
  inscripciones: 'Inscripciones',
  recaudacion: 'Recaudación',
  ticketMedio: 'Ticket medio',
  corredoresUnicos: 'Corredores únicos',
}

const EUROS = new Set(['recaudacion', 'ticketMedio'])

function formatMetrica(metrica: string, value: number): string {
  return EUROS.has(metrica) ? formatEuro(value) : formatNumber(value)
}

export function CarreraDetalle({
  carrera,
  rows,
  globalRows,
}: {
  carrera: CarreraRank
  rows: Inscripcion[]
  globalRows: Inscripcion[]
}) {
  const r = resumen(rows)
  const comparativa = comparativaVsGlobal(globalRows, carrera.key)
  const pruebas = desglosePruebas(rows)

  const tarjetas = [
    { label: 'Inscripciones', value: formatNumber(r.inscripciones) },
    { label: 'Recaudación', value: formatEuro(r.recaudacion) },
    { label: 'Ticket medio', value: formatEuro(r.ticketMedio) },
    { label: 'Corredores únicos', value: formatNumber(r.corredoresUnicos) },
  ]

  return (
    <div className="carrera-detalle">
      <div className="detalle-header">
        <h2>{carrera.nombre}</h2>
        <span className="badge">Edición {carrera.anio}</span>
      </div>

      <div className="stat-grid">
        {tarjetas.map((card) => (
          <div key={card.label} className="stat-card">
            <span className="stat-value">{card.value}</span>
            <span className="stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <ProcedenciaChart rows={rows} />

        <section className="card">
          <h3>Comparativa con el resto de carreras</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Esta carrera</th>
                <th>Media del resto</th>
                <th>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {comparativa.map((c) => {
                const sube = c.diferenciaPct >= 0
                return (
                  <tr key={c.metrica}>
                    <td>{ETIQUETAS[c.metrica] ?? c.metrica}</td>
                    <td>{formatMetrica(c.metrica, c.carrera)}</td>
                    <td>{formatMetrica(c.metrica, c.media)}</td>
                    <td className={sube ? 'delta-up' : 'delta-down'}>
                      {sube ? '▲' : '▼'} {Math.abs(c.diferenciaPct).toLocaleString('es-ES')}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </div>

      <section className="card">
        <h3>Desglose por prueba</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Prueba</th>
              <th>Inscrip.</th>
              <th>Corredores</th>
              <th>Recaudación</th>
              <th>Ticket medio</th>
            </tr>
          </thead>
          <tbody>
            {pruebas.map((p) => (
              <tr key={p.nombre}>
                <td>{p.nombre}</td>
                <td>{formatNumber(p.inscripciones)}</td>
                <td>{formatNumber(p.corredoresUnicos)}</td>
                <td>{formatEuro(p.recaudacion)}</td>
                <td>{formatEuro(p.ticketMedio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

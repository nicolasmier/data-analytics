import { cleanKey } from '../../domain/text'
import { formatNumber } from '../../lib/format'
import { useApp } from '../../state/store'

export function LoadSummary() {
  const { state, toggleNonCarrera } = useApp()
  const dataset = state.dataset
  if (!dataset) return null

  const { report, noCarrerasList } = dataset
  const stats: { label: string; value: string }[] = [
    { label: 'Ficheros', value: formatNumber(report.ficheros) },
    { label: 'Filas leídas', value: formatNumber(report.filasLeidas) },
    { label: 'Filas válidas', value: formatNumber(report.filasValidas) },
    { label: 'Carreras (ediciones)', value: formatNumber(report.carreras) },
    { label: 'Pruebas', value: formatNumber(report.pruebas) },
    { label: 'No-carrera', value: formatNumber(report.noCarreras) },
    { label: 'Descartadas', value: formatNumber(report.descartadas) },
  ]

  return (
    <details className="card load-summary">
      <summary>Datos cargados y ajustes</summary>
      <p className="tagline">
        Temporadas: {dataset.temporadas.join(', ') || '—'} · Años: {dataset.anios.join(', ') || '—'}
      </p>

      <div className="stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="state-breakdown">
        <span>CONFIRMADO: {formatNumber(report.estados.CONFIRMADO)}</span>
        <span>ANULADO: {formatNumber(report.estados.ANULADO)}</span>
        <span>APLAZADO: {formatNumber(report.estados.APLAZADO)}</span>
        <span>OTRO: {formatNumber(report.estados.OTRO)}</span>
      </div>

      {report.warnings.length > 0 ? (
        <ul className="warnings">
          {report.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {noCarrerasList.length > 0 ? (
        <section className="panel-section">
          <h3>Filas no-carrera detectadas ({formatNumber(report.noCarreras)})</h3>
          <p className="tagline">Marca las que quieras reintroducir en el análisis.</p>
          <ul className="noncarrera-list">
            {noCarrerasList.slice(0, 50).map((entry) => (
              <li key={entry.nombre}>
                <label>
                  <input
                    type="checkbox"
                    checked={state.includeNonCarrera.has(cleanKey(entry.nombre))}
                    onChange={() => toggleNonCarrera(cleanKey(entry.nombre))}
                  />
                  <span>{entry.nombre}</span>
                  <span className="muted"> ({formatNumber(entry.filas)} filas)</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </details>
  )
}

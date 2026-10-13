import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { procedencia } from '../../domain/metrics'
import type { Inscripcion } from '../../domain/types'
import { formatNumber } from '../../lib/format'
import { PIE_COLORS } from '../../lib/palette'

export function ProcedenciaChart({ rows }: { rows: Inscripcion[] }) {
  const data = procedencia(rows, { limit: 8 })
  const total = data.reduce((acc, d) => acc + d.inscripciones, 0)

  return (
    <section className="card chart-card">
      <h3>Procedencia por localidad</h3>
      {data.length === 0 ? (
        <p className="muted">Sin datos para los filtros seleccionados.</p>
      ) : (
        <div className="donut-wrap">
          <div className="donut-chart">
            <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <defs>
                {PIE_COLORS.map((color, index) => (
                  <linearGradient id={`donut-${index}`} key={color} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.65} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={data}
                dataKey="inscripciones"
                nameKey="localidad"
                innerRadius={72}
                outerRadius={112}
                paddingAngle={3}
                cornerRadius={6}
                stroke="#0e1116"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.localidad}
                    fill={`url(#donut-${index % PIE_COLORS.length})`}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#171b24',
                  border: '1px solid #242a36',
                  borderRadius: 10,
                  color: '#e6e9ef',
                }}
                formatter={(value, _name, entry) => [
                  formatNumber(Number(value)),
                  entry?.payload?.localidad ?? '',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <span className="donut-total">{formatNumber(total)}</span>
            <span className="donut-caption">inscripciones</span>
          </div>
          </div>
          <ul className="donut-legend">
            {data.map((entry, index) => (
              <li key={entry.localidad}>
                <span
                  className="donut-dot"
                  style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                <span className="donut-name">{entry.localidad}</span>
                <span className="donut-value">{formatNumber(entry.inscripciones)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

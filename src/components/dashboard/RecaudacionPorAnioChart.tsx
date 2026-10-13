import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { recaudacionPorAnio } from '../../domain/metrics'
import type { Inscripcion } from '../../domain/types'
import { formatEuro } from '../../lib/format'
import { CHART_AXIS, CHART_GRID } from '../../lib/palette'

const BAR_COLORS = ['#06b6d4', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#0ea5e9', '#ef4444', '#84cc16']

export function RecaudacionPorAnioChart({ rows }: { rows: Inscripcion[] }) {
  const raw = recaudacionPorAnio(rows)
  const data = raw.map((d, i) => ({
    year: d.anio,
    anio: String(d.anio),
    recaudacion: d.recaudacion,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }))

  return (
    <section className="card chart-card">
      <h3>Recaudación por año</h3>
      {data.length === 0 ? (
        <p className="muted">Sin datos para los filtros seleccionados.</p>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={data}
            margin={{ left: 16, right: 12, top: 12, bottom: 12 }}
            barGap={4}
            barCategoryGap={4}
          >
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="anio"
              stroke={CHART_AXIS}
              tick={{ fill: CHART_AXIS }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              stroke={CHART_AXIS}
              tick={{ fill: CHART_AXIS }}
              tickLine={false}
              axisLine={false}
              width={105}
              tickFormatter={(value) => formatEuro(Number(value))}
              domain={[0, (dataMax: number) => dataMax * 1.15]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(56,189,248,0.1)' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length > 0) {
                  return (
                    <div
                      style={{
                        background: '#171b24',
                        border: '1px solid #242a36',
                        borderRadius: 10,
                        padding: '8px 12px',
                        color: '#e6e9ef',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
                        fontSize: 13,
                      }}
                    >
                      <div style={{ opacity: 0.85, marginBottom: 2 }}>Año {label}</div>
                      <div style={{ fontWeight: 600 }}>
                        {formatEuro(Number(payload[0].value))}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="recaudacion" radius={[4, 4, 0, 0]} maxBarSize={42}>
              {data.map((entry) => (
                <Bar
                  key={entry.anio}
                  dataKey="recaudacion"
                  fill={entry.fill}
                  isAnimationActive
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}

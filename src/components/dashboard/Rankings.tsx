import type { ReactNode } from 'react'
import { carrerasPorRecaudacion, pruebasPorNombre, topCorredores } from '../../domain/metrics'
import type { Inscripcion } from '../../domain/types'
import { formatEuro, formatNumber } from '../../lib/format'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

export function Rankings({ rows }: { rows: Inscripcion[] }) {
  const corredores = topCorredores(rows, 10)
  const carrerasRecaudacion = carrerasPorRecaudacion(rows, 10)
  const pruebas = pruebasPorNombre(rows, 10)

  return (
    <div className="rank-grid">
      <Card title="Top 10 corredores">
        <table className="data-table">
          <thead>
            <tr>
              <th>Corredor</th>
              <th>Inscrip.</th>
            </tr>
          </thead>
          <tbody>
            {corredores.map((c) => (
              <tr key={c.corredorId}>
                <td>
                  {c.nombre} {c.apellidos}
                </td>
                <td>{formatNumber(c.inscripciones)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Carreras con más recaudación">
        <table className="data-table">
          <thead>
            <tr>
              <th>Carrera</th>
              <th>Año</th>
              <th>Recaudación</th>
            </tr>
          </thead>
          <tbody>
            {carrerasRecaudacion.map((c) => (
              <tr key={c.key}>
                <td>{c.nombre}</td>
                <td>{c.anio}</td>
                <td>{formatEuro(c.recaudacion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Pruebas con más corredores (total)">
        <table className="data-table">
          <thead>
            <tr>
              <th>Prueba</th>
              <th>Corredores</th>
              <th>Inscrip.</th>
            </tr>
          </thead>
          <tbody>
            {pruebas.map((p) => (
              <tr key={p.nombre}>
                <td>{p.nombre}</td>
                <td>{formatNumber(p.corredoresUnicos)}</td>
                <td>{formatNumber(p.inscripciones)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

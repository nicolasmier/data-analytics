import { useMemo, useState } from 'react'
import { carrerasDisponibles, editionKey, filtrar } from '../../domain/metrics'
import { useApp } from '../../state/store'
import { CarreraDetalle } from './CarreraDetalle'
import { DashboardFilters } from './DashboardFilters'
import { KpiGrid } from './KpiGrid'
import { LoadSummary } from './LoadSummary'
import { ProcedenciaChart } from './ProcedenciaChart'
import { Rankings } from './Rankings'
import { RecaudacionPorAnioChart } from './RecaudacionPorAnioChart'

export function Dashboard() {
  const { state, reset } = useApp()
  const dataset = state.dataset
  const [anio, setAnio] = useState<number | null>(null)
  const [carreraKey, setCarreraKey] = useState<string | null>(null)

  const inscripciones = useMemo(() => dataset?.inscripciones ?? [], [dataset])
  const rows = useMemo(() => filtrar(inscripciones, { anio }), [inscripciones, anio])
  const carreras = useMemo(() => carrerasDisponibles(rows), [rows])
  const seleccionada = useMemo(
    () => carreras.find((c) => c.key === carreraKey) ?? null,
    [carreras, carreraKey],
  )
  const carreraRows = useMemo(
    () => (seleccionada ? rows.filter((r) => editionKey(r) === seleccionada.key) : []),
    [rows, seleccionada],
  )

  if (!dataset) return null

  const handleAnio = (value: number | null) => {
    setAnio(value)
    setCarreraKey(null)
  }

  return (
    <div className="dashboard">
      <DashboardFilters
        anios={dataset.anios}
        carreras={carreras}
        anio={anio}
        carreraKey={seleccionada?.key ?? null}
        onAnio={handleAnio}
        onCarrera={setCarreraKey}
        onReset={reset}
      />

      {seleccionada ? (
        <CarreraDetalle carrera={seleccionada} rows={carreraRows} globalRows={rows} />
      ) : (
        <>
          <KpiGrid rows={rows} />
          <div className="chart-grid">
            <RecaudacionPorAnioChart rows={rows} />
            <ProcedenciaChart rows={rows} />
          </div>
          <Rankings rows={rows} />
        </>
      )}

      <LoadSummary />
    </div>
  )
}

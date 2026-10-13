import type { CarreraRank } from '../../domain/metrics'

type Props = {
  anios: number[]
  carreras: CarreraRank[]
  anio: number | null
  carreraKey: string | null
  onAnio: (anio: number | null) => void
  onCarrera: (key: string | null) => void
  onReset: () => void
}

export function DashboardFilters({
  anios,
  carreras,
  anio,
  carreraKey,
  onAnio,
  onCarrera,
  onReset,
}: Props) {
  return (
    <div className="filters">
      <label className="filter-field">
        <span>Año</span>
        <select
          value={anio ?? ''}
          onChange={(e) => onAnio(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Todos los años</option>
          {anios.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-field filter-field-wide">
        <span>Carrera (edición)</span>
        <select value={carreraKey ?? ''} onChange={(e) => onCarrera(e.target.value || null)}>
          <option value="">Panel global (todas las carreras)</option>
          {carreras.map((c) => (
            <option key={c.key} value={c.key}>
              {c.nombre} ({c.anio})
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="filters-reset" onClick={onReset}>
        Empezar de cero
      </button>
    </div>
  )
}

import { useApp } from '../../state/store'

export function ErrorState() {
  const { state, reset } = useApp()
  return (
    <div className="empty-state">
      <h2>No se pudieron procesar los ficheros</h2>
      <p className="error-text">{state.error}</p>
      <button type="button" onClick={reset}>
        Reintentar
      </button>
    </div>
  )
}

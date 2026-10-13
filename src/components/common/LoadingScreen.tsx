export function LoadingScreen() {
  return (
    <div className="empty-state">
      <div className="spinner" role="status" aria-label="Procesando" />
      <p className="tagline">Leyendo y analizando los ficheros…</p>
    </div>
  )
}

import { useRef, useState } from 'react'
import { useApp } from '../../state/store'

export function UploadScreen() {
  const { loadFiles } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function openPicker() {
    inputRef.current?.click()
  }

  function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    void loadFiles(Array.from(list))
  }

  return (
    <div className="empty-state">
      <h2>Analiza tus inscripciones en segundos</h2>
      <p className="tagline">Sube uno o varios Excel de temporada para ver el dashboard.</p>
      <div
        className={`dropzone${dragging ? ' is-dragging' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de ficheros"
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openPicker()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          onFiles(event.dataTransfer.files)
        }}
      >
        <strong>Arrastra tus Excel aquí</strong>
        <span className="hint">.xlsx .xls .csv — uno o varios ficheros</span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            openPicker()
          }}
        >
          Subir ficheros
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        multiple
        hidden
        onChange={(event) => onFiles(event.target.files)}
      />
      <p className="privacy-note">
        🔒 No se leen DNI ni teléfonos. Los datos solo viven en tu navegador.
      </p>
    </div>
  )
}

import { useState } from 'react'
import { FIELD_LABELS, REQUIRED_FIELDS, missingRequiredFields } from '../../domain/columnMapping'
import type { ColumnMapping, FieldName } from '../../domain/types'
import { useApp } from '../../state/store'

const FIELD_ORDER = Object.keys(FIELD_LABELS) as FieldName[]

export function MappingScreen() {
  const { state, applyMapping } = useApp()
  const header = state.files[0]?.table.header ?? []
  const [mapping, setMapping] = useState<ColumnMapping>(state.mapping ?? ({} as ColumnMapping))
  const missing = missingRequiredFields(mapping)

  function setField(field: FieldName, value: string) {
    setMapping((current) => ({ ...current, [field]: value === '' ? null : Number(value) }))
  }

  return (
    <div className="panel">
      <h2>Revisa el mapeo de columnas</h2>
      <p className="tagline">
        No se detectaron todos los campos obligatorios. Ajusta el mapeo y continúa.
      </p>

      <div className="mapping-grid">
        {FIELD_ORDER.map((field) => {
          const required = REQUIRED_FIELDS.includes(field)
          return (
            <label key={field} className="mapping-row">
              <span>
                {FIELD_LABELS[field]}
                {required ? <em className="req"> *</em> : null}
              </span>
              <select
                value={mapping[field] ?? ''}
                onChange={(event) => setField(field, event.target.value)}
              >
                <option value="">— sin asignar —</option>
                {header.map((name, index) => (
                  <option key={`${field}-${index}`} value={index}>
                    {name || `Columna ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          )
        })}
      </div>

      {missing.length > 0 ? (
        <p className="error-text">
          Faltan campos obligatorios: {missing.map((field) => FIELD_LABELS[field]).join(', ')}
        </p>
      ) : null}

      <div className="panel-actions">
        <button type="button" disabled={missing.length > 0} onClick={() => applyMapping(mapping)}>
          Continuar
        </button>
      </div>
    </div>
  )
}

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { buildDataset } from '../domain/dataset'
import { detectMapping, missingRequiredFields } from '../domain/columnMapping'
import { parseFiles } from '../domain/parseExcel'
import type { ColumnMapping, Dataset, ParsedFile } from '../domain/types'

export type Status = 'idle' | 'loading' | 'mapping' | 'ready' | 'error'

export type AppState = {
  status: Status
  files: ParsedFile[]
  detectedMapping: ColumnMapping | null
  mapping: ColumnMapping | null
  dataset: Dataset | null
  includeNonCarrera: Set<string>
  error: string | null
}

const initialState: AppState = {
  status: 'idle',
  files: [],
  detectedMapping: null,
  mapping: null,
  dataset: null,
  includeNonCarrera: new Set(),
  error: null,
}

type Action =
  | { type: 'reset' }
  | { type: 'load_start' }
  | { type: 'set_mapping'; files: ParsedFile[]; mapping: ColumnMapping }
  | { type: 'set_ready'; files: ParsedFile[]; mapping: ColumnMapping; dataset: Dataset }
  | { type: 'set_dataset'; dataset: Dataset; include: Set<string> }
  | { type: 'set_error'; error: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'reset':
      return initialState
    case 'load_start':
      return { ...initialState, status: 'loading' }
    case 'set_mapping':
      return {
        ...state,
        status: 'mapping',
        files: action.files,
        detectedMapping: action.mapping,
        mapping: action.mapping,
      }
    case 'set_ready':
      return {
        ...state,
        status: 'ready',
        files: action.files,
        detectedMapping: action.mapping,
        mapping: action.mapping,
        dataset: action.dataset,
        error: null,
      }
    case 'set_dataset':
      return { ...state, dataset: action.dataset, includeNonCarrera: action.include }
    case 'set_error':
      return { ...initialState, status: 'error', error: action.error }
  }
}

export type AppContextValue = {
  state: AppState
  loadFiles: (files: File[]) => Promise<void>
  applyMapping: (mapping: ColumnMapping) => void
  toggleNonCarrera: (nombre: string) => void
  reset: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    dispatch({ type: 'load_start' })
    try {
      const parsed = await parseFiles(files)
      if (parsed.length === 0) {
        dispatch({ type: 'set_error', error: 'No se pudo leer ningún fichero válido.' })
        return
      }
      const mapping = detectMapping(parsed[0].table.header)
      if (missingRequiredFields(mapping).length > 0) {
        dispatch({ type: 'set_mapping', files: parsed, mapping })
      } else {
        dispatch({
          type: 'set_ready',
          files: parsed,
          mapping,
          dataset: buildDataset(parsed, mapping),
        })
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido al leer los ficheros.'
      dispatch({ type: 'set_error', error: message })
    }
  }, [])

  const applyMapping = useCallback(
    (mapping: ColumnMapping) => {
      dispatch({
        type: 'set_ready',
        files: state.files,
        mapping,
        dataset: buildDataset(state.files, mapping, { include: state.includeNonCarrera }),
      })
    },
    [state.files, state.includeNonCarrera],
  )

  const toggleNonCarrera = useCallback(
    (nombre: string) => {
      if (!state.mapping) return
      const include = new Set(state.includeNonCarrera)
      if (include.has(nombre)) include.delete(nombre)
      else include.add(nombre)
      dispatch({
        type: 'set_dataset',
        dataset: buildDataset(state.files, state.mapping, { include }),
        include,
      })
    },
    [state.files, state.mapping, state.includeNonCarrera],
  )

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const value = useMemo<AppContextValue>(
    () => ({ state, loadFiles, applyMapping, toggleNonCarrera, reset }),
    [state, loadFiles, applyMapping, toggleNonCarrera, reset],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return context
}

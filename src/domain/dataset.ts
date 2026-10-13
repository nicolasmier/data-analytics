import { normalizeFiles } from './normalize'
import { segregate, type SegregateOptions } from './segregate'
import type { ColumnMapping, Dataset, Estado, ParsedFile } from './types'

export type BuildOptions = SegregateOptions

export function buildDataset(
  files: ParsedFile[],
  mapping: ColumnMapping,
  options: BuildOptions = {},
): Dataset {
  const { inscripciones, stats } = normalizeFiles(files, mapping)
  const { carreras, noCarreras, noCarrerasList } = segregate(inscripciones, options)

  const estados: Record<Estado, number> = { CONFIRMADO: 0, ANULADO: 0, APLAZADO: 0, OTRO: 0 }
  for (const inscripcion of inscripciones) estados[inscripcion.estado]++

  const anios = [...new Set(carreras.map((c) => c.anio))].sort((a, b) => a - b)
  const temporadas = [...new Set(files.map((f) => f.temporada).filter(Boolean))]
  const filasLeidas = files.reduce((acc, f) => acc + f.table.rows.length, 0)

  const warnings = [...stats.warnings]
  if (noCarreras > 0) {
    warnings.unshift(
      `${noCarreras} filas marcadas como no-carrera (licencias, preinscripciones, voluntarios, ...)`,
    )
  }

  return {
    inscripciones,
    carreras,
    anios,
    temporadas,
    noCarrerasList,
    report: {
      ficheros: files.length,
      filasLeidas,
      filasValidas: inscripciones.length,
      noCarreras,
      descartadas: stats.descartadas,
      preciosNoNumericos: stats.preciosNoNumericos,
      estados,
      carreras: carreras.length,
      pruebas: carreras.reduce((acc, c) => acc + c.pruebas.length, 0),
      anios,
      temporadas,
      warnings,
    },
  }
}

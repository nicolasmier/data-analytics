import { cleanKey } from './text'
import type { Carrera, Inscripcion, NonCarreraEntry, Prueba } from './types'

export const NO_RACE_KEYWORDS = [
  'LICENCIA',
  'PREINSCRIPCION',
  'PRE-INSCRIPCION',
  'VOLUNTARI',
  'LISTA DE ESPERA',
  'LISTAS DE ESPERA',
  'TALLER',
  'CIRCUITO',
]

/** true si el nombre del evento corresponde a una fila que no es una carrera (RF-07c). */
export function isNonRace(carrera: string): boolean {
  const value = cleanKey(carrera)
  return NO_RACE_KEYWORDS.some((keyword) => value.includes(keyword))
}

export type SegregateOptions = {
  /** Nombres (normalizados) de no-carrera que el usuario decide reintroducir. */
  include?: Set<string>
}

export type SegregateResult = {
  carreras: Carrera[]
  noCarreras: number
  noCarrerasList: NonCarreraEntry[]
}

function detectYearInName(name: string): number | null {
  const match = name.match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/)
  return match ? Number(match[1]) : null
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function buildPruebas(rows: Inscripcion[]): Prueba[] {
  const byPrueba = new Map<string, Inscripcion[]>()
  for (const row of rows) {
    const nombre = row.prueba || '(sin prueba)'
    const list = byPrueba.get(nombre) ?? []
    list.push(row)
    byPrueba.set(nombre, list)
  }

  return [...byPrueba.entries()]
    .map(([nombre, group]) => ({
      nombre,
      inscripciones: group.length,
      corredoresUnicos: new Set(group.map((r) => r.corredorId)).size,
      recaudacion: round2(group.reduce((acc, r) => acc + (r.precio ?? 0), 0)),
    }))
    .sort((a, b) => b.recaudacion - a.recaudacion || b.inscripciones - a.inscripciones)
}

export function segregate(
  inscripciones: Inscripcion[],
  options: SegregateOptions = {},
): SegregateResult {
  const byName = new Map<string, Inscripcion[]>()
  const nonCarreraCounts = new Map<string, NonCarreraEntry>()
  let noCarreras = 0

  for (const inscripcion of inscripciones) {
    if (!inscripcion.esCarrera) {
      noCarreras++
      const key = cleanKey(inscripcion.carrera)
      const entry = nonCarreraCounts.get(key) ?? { nombre: inscripcion.carrera, filas: 0 }
      entry.filas++
      nonCarreraCounts.set(key, entry)
      if (!options.include?.has(key)) continue
    }
    const key = cleanKey(inscripcion.carrera)
    const list = byName.get(key) ?? []
    list.push(inscripcion)
    byName.set(key, list)
  }

  const carreras: Carrera[] = []

  for (const rows of byName.values()) {
    const nombre = rows[0].carrera
    const nameYear = detectYearInName(nombre)

    let editions: { anio: number; anioEstimado: boolean; rows: Inscripcion[] }[]
    if (nameYear != null) {
      editions = [{ anio: nameYear, anioEstimado: false, rows }]
    } else {
      const byYear = new Map<number, Inscripcion[]>()
      for (const row of rows) {
        const list = byYear.get(row.anio) ?? []
        list.push(row)
        byYear.set(row.anio, list)
      }
      editions = [...byYear.entries()].map(([anio, rowsOfYear]) => ({
        anio,
        anioEstimado: true,
        rows: rowsOfYear,
      }))
    }

    for (const edition of editions) {
      carreras.push({
        key: `${cleanKey(nombre)}||${edition.anio}`,
        nombre,
        anio: edition.anio,
        anioEstimado: edition.anioEstimado,
        temporadas: [...new Set(edition.rows.map((r) => r.temporada).filter(Boolean))],
        pruebas: buildPruebas(edition.rows),
        inscripciones: edition.rows.length,
        corredoresUnicos: new Set(edition.rows.map((r) => r.corredorId)).size,
        recaudacion: round2(edition.rows.reduce((acc, r) => acc + (r.precio ?? 0), 0)),
      })
    }
  }

  carreras.sort((a, b) => a.nombre.localeCompare(b.nombre) || a.anio - b.anio)
  const noCarrerasList = [...nonCarreraCounts.values()].sort((a, b) => b.filas - a.filas)
  return { carreras, noCarreras, noCarrerasList }
}

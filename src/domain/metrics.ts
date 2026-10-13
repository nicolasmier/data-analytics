import { cleanKey } from './text'
import type { Inscripcion } from './types'

export type EstadoFiltro = 'NO_ANULADO' | 'TODOS' | 'CONFIRMADO'

export type Filtros = {
  anio?: number | null
  estado?: EstadoFiltro
}

export const ESTADO_POR_DEFECTO: EstadoFiltro = 'NO_ANULADO'

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function safeDiv(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

/** Clave de edición: nombre de carrera normalizado + año de inscripción. */
export function editionKey(row: Pick<Inscripcion, 'carrera' | 'anio'>): string {
  return `${cleanKey(row.carrera)}||${row.anio}`
}

function cumpleEstado(row: Inscripcion, estado: EstadoFiltro): boolean {
  if (estado === 'TODOS') return true
  if (estado === 'CONFIRMADO') return row.estado === 'CONFIRMADO'
  return row.estado !== 'ANULADO'
}

/** Filtros transversales de año y estado (por defecto se excluye ANULADO, Q-11). */
export function filtrar(rows: Inscripcion[], filtros: Filtros = {}): Inscripcion[] {
  const estado = filtros.estado ?? ESTADO_POR_DEFECTO
  const anio = filtros.anio ?? null
  return rows.filter((row) => {
    if (!cumpleEstado(row, estado)) return false
    if (anio != null && row.anio !== anio) return false
    return true
  })
}

export type Resumen = {
  inscripciones: number
  carreras: number
  corredoresUnicos: number
  recaudacion: number
  ticketMedio: number
}

/** M-01…M-05. */
export function resumen(rows: Inscripcion[]): Resumen {
  const editions = new Set<string>()
  const corredores = new Set<string>()
  let recaudacion = 0
  for (const row of rows) {
    editions.add(editionKey(row))
    corredores.add(row.corredorId)
    recaudacion += row.precio ?? 0
  }
  return {
    inscripciones: rows.length,
    carreras: editions.size,
    corredoresUnicos: corredores.size,
    recaudacion: round2(recaudacion),
    ticketMedio: round2(safeDiv(recaudacion, rows.length)),
  }
}

export type PuntoAnio = {
  anio: number
  inscripciones: number
  recaudacion: number
}

/** M-06. Recaudación por año de inscripción, ordenada por año. */
export function recaudacionPorAnio(rows: Inscripcion[]): PuntoAnio[] {
  const map = new Map<number, { inscripciones: number; recaudacion: number }>()
  for (const row of rows) {
    const entry = map.get(row.anio) ?? { inscripciones: 0, recaudacion: 0 }
    entry.inscripciones++
    entry.recaudacion += row.precio ?? 0
    map.set(row.anio, entry)
  }
  return [...map.entries()]
    .map(([anio, value]) => ({
      anio,
      inscripciones: value.inscripciones,
      recaudacion: round2(value.recaudacion),
    }))
    .sort((a, b) => a.anio - b.anio)
}

export type PuntoLocalidad = {
  localidad: string
  inscripciones: number
}

/** M-07 / M-24. Procedencia por localidad (top N + "Otras"), filtrable por provincia. */
export function procedencia(
  rows: Inscripcion[],
  options: { provincia?: string | null; limit?: number } = {},
): PuntoLocalidad[] {
  const limit = options.limit ?? 8
  const provincia = options.provincia ? cleanKey(options.provincia) : null
  const subset = provincia ? rows.filter((row) => cleanKey(row.provincia) === provincia) : rows

  const groups = new Map<string, Map<string, number>>()
  for (const row of subset) {
    const raw = row.localidad.trim()
    const key = raw === '' ? '(SIN LOCALIDAD)' : cleanKey(raw)
    const variants = groups.get(key) ?? new Map<string, number>()
    const display = raw === '' ? '(sin localidad)' : raw
    variants.set(display, (variants.get(display) ?? 0) + 1)
    groups.set(key, variants)
  }

  const puntos = [...groups.values()].map((variants) => {
    const entries = [...variants.entries()]
    const total = entries.reduce((acc, [, count]) => acc + count, 0)
    const accented = entries.filter(([value]) => /[\u00C0-\u024F]/.test(value))
    const pool = (accented.length ? accented : entries).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )
    return { localidad: pool[0][0], inscripciones: total }
  })

  const sorted = puntos.sort(
    (a, b) => b.inscripciones - a.inscripciones || a.localidad.localeCompare(b.localidad),
  )
  const top = sorted.slice(0, limit)
  const resto = sorted.slice(limit).reduce((acc, punto) => acc + punto.inscripciones, 0)
  if (resto > 0) top.push({ localidad: 'Otras', inscripciones: resto })
  return top
}

export type CorredorTop = {
  corredorId: string
  nombre: string
  apellidos: string
  inscripciones: number
}

function nombreCompleto(corredor: CorredorTop): string {
  return `${corredor.nombre} ${corredor.apellidos}`.trim()
}

/** M-08. Top de corredores por nº de inscripciones (desempate alfabético). */
export function topCorredores(rows: Inscripcion[], limit = 10): CorredorTop[] {
  const map = new Map<string, CorredorTop>()
  for (const row of rows) {
    const entry = map.get(row.corredorId) ?? {
      corredorId: row.corredorId,
      nombre: row.nombre,
      apellidos: row.apellidos,
      inscripciones: 0,
    }
    entry.inscripciones++
    map.set(row.corredorId, entry)
  }
  return [...map.values()]
    .sort(
      (a, b) => b.inscripciones - a.inscripciones || nombreCompleto(a).localeCompare(nombreCompleto(b)),
    )
    .slice(0, limit)
}

export type CarreraRank = {
  key: string
  nombre: string
  anio: number
  inscripciones: number
  corredoresUnicos: number
  recaudacion: number
}

function agruparCarreras(rows: Inscripcion[]): CarreraRank[] {
  const map = new Map<
    string,
    { nombre: string; anio: number; inscripciones: number; corredores: Set<string>; recaudacion: number }
  >()
  for (const row of rows) {
    const key = editionKey(row)
    const entry = map.get(key) ?? {
      nombre: row.carrera,
      anio: row.anio,
      inscripciones: 0,
      corredores: new Set<string>(),
      recaudacion: 0,
    }
    entry.inscripciones++
    entry.corredores.add(row.corredorId)
    entry.recaudacion += row.precio ?? 0
    map.set(key, entry)
  }
  return [...map.entries()].map(([key, value]) => ({
    key,
    nombre: value.nombre,
    anio: value.anio,
    inscripciones: value.inscripciones,
    corredoresUnicos: value.corredores.size,
    recaudacion: round2(value.recaudacion),
  }))
}

/** M-09. Carreras (ediciones) con más recaudación. */
export function carrerasPorRecaudacion(rows: Inscripcion[], limit = 10): CarreraRank[] {
  return agruparCarreras(rows)
    .sort(
      (a, b) => b.recaudacion - a.recaudacion || a.nombre.localeCompare(b.nombre) || a.anio - b.anio,
    )
    .slice(0, limit)
}

/** M-10. Carreras (ediciones) con más corredores únicos. */
export function carrerasPorCorredores(rows: Inscripcion[], limit = 10): CarreraRank[] {
  return agruparCarreras(rows)
    .sort(
      (a, b) =>
        b.corredoresUnicos - a.corredoresUnicos || a.nombre.localeCompare(b.nombre) || a.anio - b.anio,
    )
    .slice(0, limit)
}

/** Lista de ediciones disponibles (para selectores), ordenada por nombre y año. */
export function carrerasDisponibles(rows: Inscripcion[]): CarreraRank[] {
  return agruparCarreras(rows).sort(
    (a, b) => a.nombre.localeCompare(b.nombre) || a.anio - b.anio,
  )
}

export type PruebaRank = {
  carrera: string
  prueba: string
  anio: number
  inscripciones: number
  corredoresUnicos: number
  recaudacion: number
}

function agruparPruebas(rows: Inscripcion[]): PruebaRank[] {
  const map = new Map<
    string,
    {
      carrera: string
      prueba: string
      anio: number
      inscripciones: number
      corredores: Set<string>
      recaudacion: number
    }
  >()
  for (const row of rows) {
    const prueba = row.prueba || '(sin prueba)'
    const key = `${editionKey(row)}||${cleanKey(prueba)}`
    const entry = map.get(key) ?? {
      carrera: row.carrera,
      prueba,
      anio: row.anio,
      inscripciones: 0,
      corredores: new Set<string>(),
      recaudacion: 0,
    }
    entry.inscripciones++
    entry.corredores.add(row.corredorId)
    entry.recaudacion += row.precio ?? 0
    map.set(key, entry)
  }
  return [...map.values()].map((value) => ({
    carrera: value.carrera,
    prueba: value.prueba,
    anio: value.anio,
    inscripciones: value.inscripciones,
    corredoresUnicos: value.corredores.size,
    recaudacion: round2(value.recaudacion),
  }))
}

/** M-12. Pruebas (carrera+prueba+año) con más recaudación. */
export function pruebasPorRecaudacion(rows: Inscripcion[], limit = 10): PruebaRank[] {
  return agruparPruebas(rows)
    .sort((a, b) => b.recaudacion - a.recaudacion || a.prueba.localeCompare(b.prueba))
    .slice(0, limit)
}

/** M-13. Pruebas (carrera+prueba+año) con más corredores únicos. */
export function pruebasPorCorredores(rows: Inscripcion[], limit = 10): PruebaRank[] {
  return agruparPruebas(rows)
    .sort(
      (a, b) => b.corredoresUnicos - a.corredoresUnicos || a.prueba.localeCompare(b.prueba),
    )
    .slice(0, limit)
}

export type PruebaNombreRank = {
  nombre: string
  inscripciones: number
  corredoresUnicos: number
}

/** Pruebas (por nombre, sumando todas sus carreras/años) con más corredores. */
export function pruebasPorNombre(rows: Inscripcion[], limit = 10): PruebaNombreRank[] {
  const map = new Map<
    string,
    { nombre: string; inscripciones: number; corredores: Set<string> }
  >()
  for (const row of rows) {
    const nombre = row.prueba || '(sin prueba)'
    const key = cleanKey(nombre)
    const entry = map.get(key) ?? { nombre, inscripciones: 0, corredores: new Set<string>() }
    entry.inscripciones++
    entry.corredores.add(row.corredorId)
    map.set(key, entry)
  }
  return [...map.values()]
    .map((value) => ({
      nombre: value.nombre,
      inscripciones: value.inscripciones,
      corredoresUnicos: value.corredores.size,
    }))
    .sort(
      (a, b) =>
        b.corredoresUnicos - a.corredoresUnicos ||
        b.inscripciones - a.inscripciones ||
        a.nombre.localeCompare(b.nombre),
    )
    .slice(0, limit)
}

export type Comparativa = {
  metrica: 'inscripciones' | 'recaudacion' | 'ticketMedio' | 'corredoresUnicos'
  carrera: number
  media: number
  diferenciaPct: number
}

/** M-25. Comparativa de una edición frente a la media del resto de carreras. */
export function comparativaVsGlobal(globalRows: Inscripcion[], carreraKey: string): Comparativa[] {
  const ediciones = agruparCarreras(globalRows)
  const seleccionada = ediciones.find((c) => c.key === carreraKey)
  if (!seleccionada) return []
  const resto = ediciones.filter((c) => c.key !== carreraKey)

  const valores = {
    inscripciones: (c: CarreraRank) => c.inscripciones,
    recaudacion: (c: CarreraRank) => c.recaudacion,
    ticketMedio: (c: CarreraRank) => safeDiv(c.recaudacion, c.inscripciones),
    corredoresUnicos: (c: CarreraRank) => c.corredoresUnicos,
  }

  return (Object.keys(valores) as Comparativa['metrica'][]).map((metrica) => {
    const get = valores[metrica]
    const media = safeDiv(
      resto.reduce((acc, c) => acc + get(c), 0),
      resto.length,
    )
    const carrera = get(seleccionada)
    return {
      metrica,
      carrera: round2(carrera),
      media: round2(media),
      diferenciaPct: round1(safeDiv(carrera - media, media) * 100),
    }
  })
}

export type PruebaDetalle = {
  nombre: string
  inscripciones: number
  corredoresUnicos: number
  recaudacion: number
  ticketMedio: number
}

/** M-26. Desglose por prueba dentro de una edición. */
export function desglosePruebas(rows: Inscripcion[]): PruebaDetalle[] {
  const map = new Map<
    string,
    { nombre: string; inscripciones: number; corredores: Set<string>; recaudacion: number }
  >()
  for (const row of rows) {
    const nombre = row.prueba || '(sin prueba)'
    const key = cleanKey(nombre)
    const entry = map.get(key) ?? { nombre, inscripciones: 0, corredores: new Set<string>(), recaudacion: 0 }
    entry.inscripciones++
    entry.corredores.add(row.corredorId)
    entry.recaudacion += row.precio ?? 0
    map.set(key, entry)
  }
  return [...map.values()]
    .map((value) => ({
      nombre: value.nombre,
      inscripciones: value.inscripciones,
      corredoresUnicos: value.corredores.size,
      recaudacion: round2(value.recaudacion),
      ticketMedio: round2(safeDiv(value.recaudacion, value.inscripciones)),
    }))
    .sort((a, b) => b.inscripciones - a.inscripciones || a.nombre.localeCompare(b.nombre))
}

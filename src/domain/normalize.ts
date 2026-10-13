import { isNonRace } from './segregate'
import { canonicalLocalidad, canonicalProvincia } from './places'
import { cleanKey } from './text'
import type { CellValue, ColumnMapping, Estado, FieldName, Inscripcion, ParsedFile } from './types'

export type NormalizeStats = {
  descartadas: number
  preciosNoNumericos: number
  warnings: string[]
}

export type NormalizeResult = {
  inscripciones: Inscripcion[]
  stats: NormalizeStats
}

function text(value: CellValue): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value).replace(/\s+/g, ' ').trim()
}

export { cleanKey }

export function corredorId(email: string, nombre: string, apellidos: string): string {
  return [email, nombre, apellidos].map(cleanKey).join('|')
}

export function parsePrecio(value: CellValue): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value instanceof Date) return null
  let raw = String(value).replace(/[€\s]/g, '')
  if (raw === '') return null
  const hasComma = raw.includes(',')
  const hasDot = raw.includes('.')
  if (hasComma && hasDot) {
    raw = raw.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    raw = raw.replace(',', '.')
  }
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

const SERIAL_EPOCH = Date.UTC(1899, 11, 30)

function fromExcelSerial(serial: number): Date {
  return new Date(SERIAL_EPOCH + serial * 86400000)
}

export function parseFecha(value: CellValue): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') return fromExcelSerial(value)
  const str = String(value).trim()
  if (!str) return null

  let m = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (m) {
    const [, y, mo, d, h, mi, s] = m
    return new Date(+y, +mo - 1, +d, +(h ?? 0), +(mi ?? 0), +(s ?? 0))
  }
  m = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (m) {
    const [, d, mo, y, h, mi, s] = m
    return new Date(+y, +mo - 1, +d, +(h ?? 0), +(mi ?? 0), +(s ?? 0))
  }
  const fallback = new Date(str)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

export function parseInvitado(value: CellValue): boolean {
  const v = cleanKey(text(value))
  return v === 'S' || v === 'SI' || v === 'Y' || v === '1' || v === 'TRUE'
}

export function parseFederado(value: CellValue): boolean | null {
  const v = cleanKey(text(value))
  if (v === '') return null
  if (v === 'S' || v === 'SI' || v === 'Y' || v === '1' || v === 'TRUE') return true
  return false
}

export function parseEstado(value: CellValue): Estado {
  const v = cleanKey(text(value))
  if (v === 'CONFIRMADO' || v === 'CONFIRMADA') return 'CONFIRMADO'
  if (v === 'ANULADO' || v === 'ANULADA' || v === 'CANCELADO') return 'ANULADO'
  if (v === 'APLAZADO' || v === 'APLAZADA') return 'APLAZADO'
  return 'OTRO'
}

function cell(row: CellValue[], mapping: ColumnMapping, field: FieldName): CellValue {
  const index = mapping[field]
  return index == null ? undefined : row[index]
}

function optText(row: CellValue[], mapping: ColumnMapping, field: FieldName): string | undefined {
  const value = text(cell(row, mapping, field))
  return value === '' ? undefined : value
}

export function normalizeRow(
  row: CellValue[],
  mapping: ColumnMapping,
  temporada: string,
  stats: NormalizeStats,
): Inscripcion | null {
  const carrera = text(cell(row, mapping, 'carrera'))
  const nombre = text(cell(row, mapping, 'nombre'))
  const apellidos = text(cell(row, mapping, 'apellidos'))
  const email = text(cell(row, mapping, 'email'))
  const fecha = parseFecha(cell(row, mapping, 'fechaInscripcion'))

  if (!carrera || (!nombre && !apellidos && !email) || !fecha) {
    stats.descartadas++
    return null
  }

  const rawPrecio = cell(row, mapping, 'precio')
  const precio = parsePrecio(rawPrecio)
  if (precio == null && rawPrecio != null && text(rawPrecio) !== '') {
    stats.preciosNoNumericos++
  }

  return {
    id: text(cell(row, mapping, 'id')),
    idMultiple: optText(row, mapping, 'idMultiple'),
    fechaInscripcion: fecha,
    anio: fecha.getFullYear(),
    estado: parseEstado(cell(row, mapping, 'estado')),
    carrera,
    prueba: text(cell(row, mapping, 'prueba')),
    precio,
    invitado: parseInvitado(cell(row, mapping, 'invitado')),
    federado: parseFederado(cell(row, mapping, 'federado')),
    dorsal: optText(row, mapping, 'dorsal'),
    nombre,
    apellidos,
    email,
    corredorId: corredorId(email, nombre, apellidos),
    localidad: canonicalLocalidad(text(cell(row, mapping, 'localidad'))),
    provincia: canonicalProvincia(text(cell(row, mapping, 'provincia'))),
    pais: text(cell(row, mapping, 'pais')),
    sexo: optText(row, mapping, 'sexo'),
    categoria: optText(row, mapping, 'categoria'),
    club: optText(row, mapping, 'club'),
    nacionalidad: optText(row, mapping, 'nacionalidad'),
    temporada,
    esCarrera: !isNonRace(carrera),
  }
}

export function normalizeFiles(files: ParsedFile[], mapping: ColumnMapping): NormalizeResult {
  const stats: NormalizeStats = { descartadas: 0, preciosNoNumericos: 0, warnings: [] }
  const inscripciones: Inscripcion[] = []

  for (const file of files) {
    for (const row of file.table.rows) {
      const inscripcion = normalizeRow(row, mapping, file.temporada, stats)
      if (inscripcion) inscripciones.push(inscripcion)
    }
  }

  if (stats.descartadas > 0) {
    stats.warnings.push(
      `${stats.descartadas} filas descartadas por falta de carrera, corredor o fecha.`,
    )
  }
  if (stats.preciosNoNumericos > 0) {
    stats.warnings.push(
      `${stats.preciosNoNumericos} filas con importe no numérico (precio = null).`,
    )
  }

  return { inscripciones, stats }
}

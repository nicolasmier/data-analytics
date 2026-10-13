import * as XLSX from 'xlsx'
import type { CellValue, ParsedFile, RawTable } from './types'

export const SENSITIVE_COLUMNS = new Set([
  'NÚMERO IDENTIFICACIÓN',
  'NUMERO IDENTIFICACION',
  'TIPO IDENTIFICACIÓN',
  'TIPO IDENTIFICACION',
  'TFNO. MÓVIL',
  'TFNO. MOVIL',
  'TFNO. FIJO',
  'DIRECCIÓN',
  'DIRECCION',
  'C.P.',
  'COMENTARIOS',
  'NOTAS INTERNAS',
])

const HEADER_HINTS = ['NOMBRE DEL EVENTO', 'ID INSCRIPCIÓN', 'CUOTA INSCRIPCIÓN']

export type FileLike = {
  name: string
  arrayBuffer: () => Promise<ArrayBuffer>
}

function normalizeHeader(value: CellValue): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function findHeaderIndex(rows: CellValue[][]): number {
  return rows.findIndex((row) => row.some((cell) => HEADER_HINTS.includes(normalizeHeader(cell))))
}

/** Etiqueta de temporada a partir del nombre del fichero (RF-07b). */
export function temporadaFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  const range = base.match(/(\d{4})\s*[-_/]\s*(\d{4})/)
  if (range) return `${range[1]}-${range[2]}`
  const single = base.match(/(\d{4})/)
  if (single) return single[1]
  return ''
}

export function tableFromWorkbook(data: ArrayBuffer | Uint8Array): RawTable {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const wb = XLSX.read(bytes, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames.includes('Inscripciones') ? 'Inscripciones' : wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<CellValue[]>(ws, {
    header: 1,
    blankrows: false,
    defval: '',
  })

  const headerIndex = findHeaderIndex(rows)
  if (headerIndex === -1) {
    throw new Error('No se encontró la fila de cabeceras (NOMBRE DEL EVENTO / ID INSCRIPCIÓN).')
  }

  const rawHeader = rows[headerIndex].map(normalizeHeader)
  const keepIndexes: number[] = []
  const header: string[] = []
  rawHeader.forEach((name, idx) => {
    if (SENSITIVE_COLUMNS.has(name)) return
    keepIndexes.push(idx)
    header.push(name)
  })

  const dataRows = rows
    .slice(headerIndex + 1)
    .filter((row) => row.some((cell) => cell !== '' && cell != null))
  const mapped = dataRows.map((row) => keepIndexes.map((idx) => row[idx] ?? ''))

  return { header, rows: mapped }
}

export async function parseFiles(files: FileLike[]): Promise<ParsedFile[]> {
  const parsed: ParsedFile[] = []
  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const table = tableFromWorkbook(buffer)
    parsed.push({ fileName: file.name, temporada: temporadaFromFileName(file.name), table })
  }
  return parsed
}

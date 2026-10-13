// Genera un Excel de prueba ANONIMIZADO a partir de los ficheros reales de `bd empate/`.
// Nunca lee ni escribe DNI/NIF ni teléfonos. Uso:
//   node scripts/make-sample.mjs [--rows 300] [fichero ...]
// Por defecto combina muestras de varias temporadas. Salida: sample/sample.xlsx
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const here = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(here, '..')
const repoDir = resolve(appDir, '..')
const bdDir = join(repoDir, 'bd empate')
const outDir = join(appDir, 'sample')

// Columnas que NUNCA se leen ni se copian (prohibidas por privacidad).
const SENSITIVE = new Set([
  'NÚMERO IDENTIFICACIÓN',
  'TIPO IDENTIFICACIÓN',
  'TFNO. MÓVIL',
  'TFNO. FIJO',
  'DIRECCIÓN',
  'C.P.',
  'COMENTARIOS',
  'NOTAS INTERNAS',
])

const HEADER_KEY = 'NOMBRE DEL EVENTO'

const args = process.argv.slice(2)
let rowLimit = 300
const files = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--rows') {
    rowLimit = Number(args[++i])
  } else {
    files.push(args[i])
  }
}

const defaultFiles = [
  'INSCRIPCIONES EMPATE 2018-2019.xlsx',
  'INSCRIPCIONES EMPATE 2020-2021.xlsx',
  'INSCRIPCIONES EMPATE 2022-2023.xlsx',
  'INSCRIPCIONES EMPATE 2024-2025.xlsx',
]
const inputFiles = files.length > 0 ? files : defaultFiles

function findHeaderRow(rows) {
  return rows.findIndex((row) => Array.isArray(row) && row.includes(HEADER_KEY))
}

function anonymize(value, rowIndex, columnName) {
  if (value == null || value === '') return value
  switch (columnName) {
    case 'NOMBRE':
      return `Nombre${rowIndex}`
    case 'APELLIDOS':
      return `Apellidos${rowIndex}`
    case 'E-MAIL':
      return `corredor${rowIndex}@example.com`
    default:
      return value
  }
}

const outputRows = []
let header = null
let globalRow = 0

for (const file of inputFiles) {
  let rows
  try {
    const wb = XLSX.read(readFileSync(join(bdDir, file)), { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' })
  } catch (err) {
    console.warn(`⚠️  No se pudo leer "${file}": ${err.message}`)
    continue
  }

  const headerIndex = findHeaderRow(rows)
  if (headerIndex === -1) {
    console.warn(`⚠️  Cabecera no encontrada en "${file}"`)
    continue
  }

  const fileHeader = rows[headerIndex]
  const keepIndexes = []
  const keepNames = []
  fileHeader.forEach((name, idx) => {
    if (!SENSITIVE.has(String(name).trim())) {
      keepIndexes.push(idx)
      keepNames.push(String(name).trim())
    }
  })

  if (!header) header = keepNames

  const dataRows = rows.slice(headerIndex + 1, headerIndex + 1 + rowLimit)
  for (const row of dataRows) {
    const mapped = keepIndexes.map((idx, i) => anonymize(row[idx], globalRow, keepNames[i]))
    outputRows.push(mapped)
    globalRow++
  }
  console.log(`✓ ${file}: ${dataRows.length} filas (anonimizadas)`)
}

if (!header) {
  console.error('No se generó ninguna fila. Revisa los ficheros de entrada.')
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })
const outFile = join(outDir, 'sample.xlsx')
const ws = XLSX.utils.aoa_to_sheet([header, ...outputRows])
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Inscripciones')
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
writeFileSync(outFile, buffer)

console.log(`\n💾 Guardado ${outFile} (${outputRows.length} filas, ${header.length} columnas)`)
console.log('   Sin DNI, sin teléfonos, identidad anonimizada.')

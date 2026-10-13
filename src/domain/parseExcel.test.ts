import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { tableFromWorkbook, temporadaFromFileName } from './parseExcel'

function buffer(rows: unknown[][]): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inscripciones')
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('tableFromWorkbook', () => {
  it('descarta columnas prohibidas (DNI y teléfonos)', () => {
    const table = tableFromWorkbook(
      buffer([
        [
          'ID INSCRIPCIÓN',
          'FECHA INSCRIPCIÓN',
          'NOMBRE DEL EVENTO',
          'NÚMERO IDENTIFICACIÓN',
          'TFNO. MÓVIL',
          'NOMBRE',
        ],
        ['A1', '2024-01-01 10:00:00', 'TRAIL X', '12345678Z', '600000000', 'Ana'],
      ]),
    )
    expect(table.header).toEqual([
      'ID INSCRIPCIÓN',
      'FECHA INSCRIPCIÓN',
      'NOMBRE DEL EVENTO',
      'NOMBRE',
    ])
    expect(table.rows[0]).toEqual(['A1', '2024-01-01 10:00:00', 'TRAIL X', 'Ana'])
    expect(JSON.stringify(table)).not.toContain('12345678Z')
    expect(JSON.stringify(table)).not.toContain('600000000')
  })

  it('localiza la cabecera aunque no sea la primera fila', () => {
    const table = tableFromWorkbook(
      buffer([
        ['Informe de inscripciones'],
        ['Generado por Avaibook'],
        ['NOMBRE DEL EVENTO', 'NOMBRE'],
        ['TRAIL X', 'Ana'],
      ]),
    )
    expect(table.header).toEqual(['NOMBRE DEL EVENTO', 'NOMBRE'])
    expect(table.rows).toHaveLength(1)
  })

  it('lanza error si no encuentra cabeceras', () => {
    expect(() => tableFromWorkbook(buffer([['foo', 'bar']]))).toThrow()
  })
})

describe('temporadaFromFileName', () => {
  it('extrae rangos AAAA-AAAA', () => {
    expect(temporadaFromFileName('INSCRIPCIONES EMPATE 2024-2025.xlsx')).toBe('2024-2025')
  })

  it('extrae un año suelto', () => {
    expect(temporadaFromFileName('INSCRIPCIONES EMPATE 2026-08-10-26.xlsx')).toBe('2026')
  })

  it('devuelve vacío si no hay año', () => {
    expect(temporadaFromFileName('INSCRIPCIONES NORTEA.xlsx')).toBe('')
  })
})

import { describe, expect, it } from 'vitest'
import {
  corredorId,
  normalizeRow,
  parseEstado,
  parseFecha,
  parseFederado,
  parseInvitado,
  parsePrecio,
  type NormalizeStats,
} from './normalize'
import type { ColumnMapping } from './types'

const mapping: ColumnMapping = {
  id: 0,
  idMultiple: 1,
  fechaInscripcion: 2,
  estado: 3,
  carrera: 4,
  prueba: 5,
  precio: 6,
  invitado: 7,
  federado: 8,
  dorsal: 9,
  nombre: 10,
  apellidos: 11,
  email: 12,
  localidad: 13,
  provincia: 14,
  pais: 15,
  sexo: 16,
  categoria: 17,
  club: 18,
  nacionalidad: 19,
}

function newStats(): NormalizeStats {
  return { descartadas: 0, preciosNoNumericos: 0, warnings: [] }
}

describe('parsePrecio', () => {
  it('acepta números, coma decimal, símbolo € y miles', () => {
    expect(parsePrecio(12.5)).toBe(12.5)
    expect(parsePrecio('12,50')).toBe(12.5)
    expect(parsePrecio('12.50')).toBe(12.5)
    expect(parsePrecio('105,00 €')).toBe(105)
    expect(parsePrecio('1.234,56')).toBe(1234.56)
  })

  it('devuelve null para vacío y no numérico', () => {
    expect(parsePrecio('')).toBeNull()
    expect(parsePrecio(null)).toBeNull()
    expect(parsePrecio('gratis')).toBeNull()
  })
})

describe('parseFecha', () => {
  it('acepta datetime aaaa-mm-dd hh:mm:ss', () => {
    const date = parseFecha('2024-01-01 11:04:46')
    expect(date?.getFullYear()).toBe(2024)
    expect(date?.getMonth()).toBe(0)
    expect(date?.getDate()).toBe(1)
  })

  it('acepta aaaa/mm/dd y dd/mm/aaaa', () => {
    expect(parseFecha('2024/03/05')?.getDate()).toBe(5)
    expect(parseFecha('05/03/2024')?.getMonth()).toBe(2)
  })

  it('acepta Date nativo', () => {
    const native = new Date(2022, 5, 10)
    expect(parseFecha(native)).toBe(native)
  })

  it('devuelve null para valores inválidos', () => {
    expect(parseFecha('')).toBeNull()
    expect(parseFecha(null)).toBeNull()
  })
})

describe('booleanos y estado', () => {
  it('parseInvitado', () => {
    expect(parseInvitado('S')).toBe(true)
    expect(parseInvitado('N')).toBe(false)
    expect(parseInvitado('')).toBe(false)
  })

  it('parseFederado con vacío = null', () => {
    expect(parseFederado('S')).toBe(true)
    expect(parseFederado('N')).toBe(false)
    expect(parseFederado('')).toBeNull()
  })

  it('parseEstado', () => {
    expect(parseEstado('CONFIRMADO')).toBe('CONFIRMADO')
    expect(parseEstado('anulado')).toBe('ANULADO')
    expect(parseEstado('vaya')).toBe('OTRO')
  })
})

describe('corredorId', () => {
  it('combina email + nombre + apellidos normalizados', () => {
    expect(corredorId('A@B.com', 'ana', 'López')).toBe('A@B.COM|ANA|LOPEZ')
  })
})

describe('normalizeRow', () => {
  const row = [
    'ID1',
    '',
    '2024-01-01 10:00:00',
    'CONFIRMADO',
    'TRAIL X',
    'MARATÓN',
    '25,00',
    'N',
    'S',
    '123',
    'Ana',
    'López',
    'ana@example.com',
    'Gijón',
    'Asturias',
    'España',
    'F',
    'Senior',
    'Club X',
    'ES',
  ]

  it('construye una inscripción válida', () => {
    const stats = newStats()
    const ins = normalizeRow(row, mapping, '2023-2024', stats)
    expect(ins).not.toBeNull()
    expect(ins?.anio).toBe(2024)
    expect(ins?.precio).toBe(25)
    expect(ins?.federado).toBe(true)
    expect(ins?.invitado).toBe(false)
    expect(ins?.esCarrera).toBe(true)
    expect(ins?.corredorId).toBe('ANA@EXAMPLE.COM|ANA|LOPEZ')
    expect(stats.descartadas).toBe(0)
  })

  it('marca esCarrera=false para licencias', () => {
    const stats = newStats()
    const licencia = [...row]
    licencia[4] = 'LICENCIAS AVIENTU 2018'
    const ins = normalizeRow(licencia, mapping, '2018', stats)
    expect(ins?.esCarrera).toBe(false)
  })

  it('descarta filas sin carrera o sin corredor', () => {
    const stats = newStats()
    const sinCarrera = [...row]
    sinCarrera[4] = ''
    expect(normalizeRow(sinCarrera, mapping, '', stats)).toBeNull()
    expect(stats.descartadas).toBe(1)

    const sinCorredor = [...row]
    sinCorredor[10] = ''
    sinCorredor[11] = ''
    sinCorredor[12] = ''
    expect(normalizeRow(sinCorredor, mapping, '', stats)).toBeNull()
    expect(stats.descartadas).toBe(2)
  })

  it('cuenta precios no numéricos', () => {
    const stats = newStats()
    const conPrecioTexto = [...row]
    conPrecioTexto[6] = 'gratis'
    const ins = normalizeRow(conPrecioTexto, mapping, '', stats)
    expect(ins?.precio).toBeNull()
    expect(stats.preciosNoNumericos).toBe(1)
  })
})

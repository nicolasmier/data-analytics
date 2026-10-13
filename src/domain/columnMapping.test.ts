import { describe, expect, it } from 'vitest'
import { autoMapping, detectMapping, missingRequiredFields, normalizeText } from './columnMapping'

const HEADER = [
  'ID INSCRIPCIÓN',
  'ID INSCRIPCIÓN MÚLTIPLE',
  'IDIOMA DE LA INSCRIPCIÓN',
  'FECHA INSCRIPCIÓN',
  'ESTADO',
  'NOMBRE DEL EVENTO',
  'FORMA DE PAGO',
  'IMPORTE INSCRIPCIÓN',
  'INVITADO',
  'CUOTA INSCRIPCIÓN',
  'DORSAL',
  'NOMBRE',
  'APELLIDOS',
  'SEXO',
  'CATEGORÍA',
  'E-MAIL',
  'CLUB',
  'NACIONALIDAD',
  'POBLACIÓN',
  'PROVINCIA',
  'PAÍS DE RESIDENCIA',
  'FEDERADO',
]

describe('detectMapping', () => {
  it('detecta todas las columnas reales de Avaibook', () => {
    const mapping = detectMapping(HEADER)
    expect(mapping.id).toBe(0)
    expect(mapping.idMultiple).toBe(1)
    expect(mapping.fechaInscripcion).toBe(3)
    expect(mapping.estado).toBe(4)
    expect(mapping.carrera).toBe(5)
    expect(mapping.precio).toBe(7)
    expect(mapping.invitado).toBe(8)
    expect(mapping.prueba).toBe(9)
    expect(mapping.dorsal).toBe(10)
    expect(mapping.nombre).toBe(11)
    expect(mapping.apellidos).toBe(12)
    expect(mapping.email).toBe(15)
    expect(mapping.localidad).toBe(18)
    expect(mapping.provincia).toBe(19)
    expect(mapping.pais).toBe(20)
    expect(mapping.federado).toBe(21)
  })

  it('no confunde FECHA INSCRIPCIÓN con IDIOMA DE LA INSCRIPCIÓN', () => {
    const mapping = detectMapping(HEADER)
    expect(mapping.fechaInscripcion).not.toBe(2)
  })

  it('marca los obligatorios como detectados', () => {
    const mapping = detectMapping(HEADER)
    expect(missingRequiredFields(mapping)).toEqual([])
  })

  it('reporta obligatorios ausentes', () => {
    const { missing } = autoMapping(['NOMBRE DEL EVENTO', 'NOMBRE'])
    expect(missing).toContain('precio')
    expect(missing).toContain('email')
  })
})

describe('normalizeText', () => {
  it('quita acentos y colapsa espacios', () => {
    expect(normalizeText('  Número   Identificación ')).toBe('NUMERO IDENTIFICACION')
  })
})

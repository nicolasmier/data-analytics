import { describe, expect, it } from 'vitest'
import { canonicalLocalidad, canonicalProvincia, titleCaseEs } from './places'

describe('titleCaseEs', () => {
  it('capitaliza respetando acentos y conectores', () => {
    expect(titleCaseEs('GIJÓN')).toBe('Gijón')
    expect(titleCaseEs('LEóN')).toBe('León')
    expect(titleCaseEs('SOTO DEL BARCO')).toBe('Soto del Barco')
    expect(titleCaseEs('oviedo')).toBe('Oviedo')
  })
})

describe('canonicalProvincia', () => {
  it('unifica variantes de escritura en el nombre canónico', () => {
    for (const value of ['asturias', 'Asturias', 'ASTURIAS', 'ÁSTURIAS']) {
      expect(canonicalProvincia(value)).toBe('Asturias')
    }
  })

  it('corrige acentos corruptos y sinónimos', () => {
    expect(canonicalProvincia('LEóN')).toBe('León')
    expect(canonicalProvincia('MáLAGA')).toBe('Málaga')
    expect(canonicalProvincia('BIZKAIA')).toBe('Vizcaya')
    expect(canonicalProvincia('GIPUZKOA')).toBe('Guipúzcoa')
    expect(canonicalProvincia('PALMAS (LAS)')).toBe('Las Palmas')
    expect(canonicalProvincia('LA CORUÑA')).toBe('A Coruña')
  })

  it('capitaliza las desconocidas y respeta vacío', () => {
    expect(canonicalProvincia('NIEDERSACHSEN')).toBe('Niedersachsen')
    expect(canonicalProvincia('')).toBe('')
  })
})

describe('canonicalLocalidad', () => {
  it('unifica mayúsculas/minúsculas', () => {
    for (const value of ['gijón', 'Gijón', 'GIJÓN']) {
      expect(canonicalLocalidad(value)).toBe('Gijón')
    }
  })
})

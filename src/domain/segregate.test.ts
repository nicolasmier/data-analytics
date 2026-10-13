import { describe, expect, it } from 'vitest'
import { isNonRace, segregate } from './segregate'
import type { Inscripcion } from './types'

function ins(partial: Partial<Inscripcion> & { carrera: string; anio: number }): Inscripcion {
  const nombre = partial.nombre ?? 'Ana'
  const apellidos = partial.apellidos ?? 'López'
  const email = partial.email ?? 'ana@example.com'
  return {
    id: partial.id ?? 'x',
    fechaInscripcion: new Date(partial.anio, 0, 15),
    anio: partial.anio,
    estado: partial.estado ?? 'CONFIRMADO',
    carrera: partial.carrera,
    prueba: partial.prueba ?? 'GENERAL',
    precio: partial.precio ?? 20,
    invitado: false,
    federado: null,
    nombre,
    apellidos,
    email,
    corredorId: `${email}|${nombre}|${apellidos}`,
    localidad: 'Gijón',
    provincia: 'Asturias',
    pais: 'España',
    temporada: partial.temporada ?? '',
    esCarrera: partial.esCarrera ?? true,
  }
}

describe('isNonRace', () => {
  it('detecta licencias, preinscripciones y voluntarios', () => {
    expect(isNonRace('LICENCIAS AVIENTU 2018')).toBe(true)
    expect(isNonRace('PREINSCRIPCIONES TRAVESERA 2025')).toBe(true)
    expect(isNonRace('VOLUNTARIOS TRAIL')).toBe(true)
    expect(isNonRace('CIRCUITO DE MONTAÑA')).toBe(true)
  })

  it('no marca carreras reales', () => {
    expect(isNonRace('VIII TRAIL GIJÓN')).toBe(false)
    expect(isNonRace('CARRERA DE LA MUJER')).toBe(false)
  })
})

describe('segregate', () => {
  it('separa ediciones de un mismo nombre por año de inscripción (Q-13)', () => {
    const rows = [
      ins({ carrera: 'PUERTA DE MUNIELLOS', anio: 2018 }),
      ins({ carrera: 'PUERTA DE MUNIELLOS', anio: 2019, email: 'b@x.com' }),
    ]
    const { carreras } = segregate(rows)
    expect(carreras.map((c) => c.anio)).toEqual([2018, 2019])
  })

  it('usa el año del nombre cuando existe y no lo estima', () => {
    const rows = [ins({ carrera: 'CARREIRA DA CAMELIA 2024', anio: 2024 })]
    const { carreras } = segregate(rows)
    expect(carreras[0].anio).toBe(2024)
    expect(carreras[0].anioEstimado).toBe(false)
  })

  it('agrupa pruebas y calcula recaudación y corredores únicos', () => {
    const rows = [
      ins({ carrera: 'TRAIL X', anio: 2024, prueba: 'MARATÓN', precio: 30 }),
      ins({ carrera: 'TRAIL X', anio: 2024, prueba: 'MARATÓN', precio: 30, email: 'b@x.com' }),
      ins({ carrera: 'TRAIL X', anio: 2024, prueba: '10K', precio: 15, email: 'c@x.com' }),
    ]
    const { carreras } = segregate(rows)
    const carrera = carreras[0]
    expect(carrera.inscripciones).toBe(3)
    expect(carrera.corredoresUnicos).toBe(3)
    expect(carrera.recaudacion).toBe(75)
    expect(carrera.pruebas).toHaveLength(2)
    expect(carrera.pruebas[0].nombre).toBe('MARATÓN')
    expect(carrera.pruebas[0].inscripciones).toBe(2)
  })

  it('excluye no-carreras y las cuenta', () => {
    const rows = [
      ins({ carrera: 'TRAIL X', anio: 2024 }),
      ins({ carrera: 'LICENCIAS 2024', anio: 2024, esCarrera: false, email: 'b@x.com' }),
    ]
    const { carreras, noCarreras } = segregate(rows)
    expect(carreras).toHaveLength(1)
    expect(noCarreras).toBe(1)
  })

  it('reintroduce no-carreras incluidas por el usuario', () => {
    const rows = [
      ins({ carrera: 'TRAIL X', anio: 2024 }),
      ins({ carrera: 'LICENCIAS 2024', anio: 2024, esCarrera: false, email: 'b@x.com' }),
    ]
    const { carreras, noCarreras } = segregate(rows, { include: new Set(['LICENCIAS 2024']) })
    expect(carreras).toHaveLength(2)
    expect(noCarreras).toBe(1)
  })
})

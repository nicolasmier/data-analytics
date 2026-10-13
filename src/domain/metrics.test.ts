import { describe, expect, it } from 'vitest'
import {
  carrerasPorCorredores,
  carrerasPorRecaudacion,
  comparativaVsGlobal,
  desglosePruebas,
  editionKey,
  filtrar,
  procedencia,
  pruebasPorCorredores,
  pruebasPorRecaudacion,
  recaudacionPorAnio,
  resumen,
  topCorredores,
} from './metrics'
import type { Inscripcion } from './types'

let seq = 0

function ins(partial: Partial<Inscripcion> = {}): Inscripcion {
  seq++
  const nombre = partial.nombre ?? 'Ana'
  const apellidos = partial.apellidos ?? 'López'
  const email = partial.email ?? 'ana@example.com'
  return {
    id: partial.id ?? `id-${seq}`,
    fechaInscripcion: partial.fechaInscripcion ?? new Date('2024-01-01'),
    anio: partial.anio ?? 2024,
    estado: partial.estado ?? 'CONFIRMADO',
    carrera: partial.carrera ?? 'Carrera A',
    prueba: partial.prueba ?? '10K',
    precio: partial.precio === undefined ? 10 : partial.precio,
    invitado: partial.invitado ?? false,
    federado: partial.federado ?? null,
    nombre,
    apellidos,
    email,
    corredorId: partial.corredorId ?? `${email}|${nombre}|${apellidos}`,
    localidad: partial.localidad ?? 'Oviedo',
    provincia: partial.provincia ?? 'Asturias',
    pais: partial.pais ?? 'España',
    temporada: partial.temporada ?? '2023-2024',
    esCarrera: partial.esCarrera ?? true,
  }
}

describe('editionKey', () => {
  it('normaliza el nombre y añade el año', () => {
    expect(editionKey(ins({ carrera: 'Carrera  A', anio: 2024 }))).toBe('CARRERA A||2024')
  })
})

describe('filtrar (Q-11)', () => {
  const rows = [
    ins({ estado: 'CONFIRMADO' }),
    ins({ estado: 'ANULADO' }),
    ins({ estado: 'APLAZADO' }),
  ]

  it('excluye ANULADO por defecto', () => {
    expect(filtrar(rows)).toHaveLength(2)
  })

  it('permite ver todos o solo confirmados', () => {
    expect(filtrar(rows, { estado: 'TODOS' })).toHaveLength(3)
    expect(filtrar(rows, { estado: 'CONFIRMADO' })).toHaveLength(1)
  })

  it('filtra por año', () => {
    const mixed = [ins({ anio: 2023 }), ins({ anio: 2024 })]
    expect(filtrar(mixed, { anio: 2024 })).toHaveLength(1)
  })
})

describe('resumen (M-01…M-05)', () => {
  it('cuenta inscripciones, ediciones, corredores, recaudación y ticket', () => {
    const rows = [
      ins({ carrera: 'A', precio: 20 }),
      ins({ carrera: 'A', precio: 20 }),
      ins({ carrera: 'B', precio: 30, email: 'luis@x.com', nombre: 'Luis', apellidos: 'Ruiz' }),
    ]
    expect(resumen(rows)).toEqual({
      inscripciones: 3,
      carreras: 2,
      corredoresUnicos: 2,
      recaudacion: 70,
      ticketMedio: 23.33,
    })
  })

  it('trata precios nulos como 0 y evita dividir por cero', () => {
    expect(resumen([]).ticketMedio).toBe(0)
    expect(resumen([ins({ precio: null })]).recaudacion).toBe(0)
  })
})

describe('recaudacionPorAnio (M-06)', () => {
  it('agrupa y ordena por año', () => {
    const rows = [
      ins({ anio: 2024, precio: 10 }),
      ins({ anio: 2023, precio: 5 }),
      ins({ anio: 2024, precio: 15 }),
    ]
    expect(recaudacionPorAnio(rows)).toEqual([
      { anio: 2023, inscripciones: 1, recaudacion: 5 },
      { anio: 2024, inscripciones: 2, recaudacion: 25 },
    ])
  })
})

describe('procedencia (M-07 / M-24)', () => {
  it('devuelve top N + Otras', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ins({ localidad: `L${i}` }))
    const top = procedencia(rows, { limit: 3 })
    expect(top).toHaveLength(4)
    expect(top[3]).toEqual({ localidad: 'Otras', inscripciones: 7 })
  })

  it('filtra por provincia', () => {
    const rows = [
      ins({ localidad: 'Oviedo', provincia: 'Asturias' }),
      ins({ localidad: 'León', provincia: 'León' }),
    ]
    const top = procedencia(rows, { provincia: 'Asturias' })
    expect(top).toEqual([{ localidad: 'Oviedo', inscripciones: 1 }])
  })

  it('unifica localidades con distinto acento', () => {
    const rows = [
      ins({ localidad: 'GIJON' }),
      ins({ localidad: 'Gijón', email: 'b@x.com' }),
    ]
    expect(procedencia(rows)).toEqual([{ localidad: 'Gijón', inscripciones: 2 }])
  })
})

describe('topCorredores (M-08)', () => {
  it('ordena por inscripciones y desempata alfabéticamente', () => {
    const rows = [
      ins({ nombre: 'Mar', apellidos: 'Yebra', email: 'mar@x.com' }),
      ins({ nombre: 'Luis', apellidos: 'Abad', email: 'luis@x.com' }),
      ins({ nombre: 'Ana', apellidos: 'López', email: 'ana@x.com' }),
      ins({ nombre: 'Ana', apellidos: 'López', email: 'ana@x.com' }),
    ]
    const top = topCorredores(rows)
    expect(top.map((c) => `${c.nombre} ${c.apellidos}`)).toEqual(['Ana López', 'Luis Abad', 'Mar Yebra'])
  })
})

describe('rankings de carrera (M-09 / M-10)', () => {
  const rows = [
    ins({ carrera: 'A', precio: 100 }),
    ins({ carrera: 'A', precio: 0, email: 'x@x.com' }),
    ins({ carrera: 'B', precio: 60, email: 'y@y.com' }),
    ins({ carrera: 'B', precio: 60, email: 'z@z.com' }),
    ins({ carrera: 'B', precio: 0, email: 'w@w.com' }),
  ]

  it('por recaudación', () => {
    const top = carrerasPorRecaudacion(rows)
    expect(top[0]).toMatchObject({ nombre: 'B', recaudacion: 120 })
    expect(top[1]).toMatchObject({ nombre: 'A', recaudacion: 100 })
  })

  it('por corredores únicos', () => {
    const top = carrerasPorCorredores(rows)
    expect(top[0]).toMatchObject({ nombre: 'B', corredoresUnicos: 3 })
    expect(top[1]).toMatchObject({ nombre: 'A', corredoresUnicos: 2 })
  })
})

describe('rankings de prueba (M-12 / M-13)', () => {
  const rows = [
    ins({ carrera: 'A', prueba: '10K', precio: 100 }),
    ins({ carrera: 'A', prueba: '10K', precio: 0, email: 'x@x.com' }),
    ins({ carrera: 'A', prueba: '21K', precio: 200, email: 'm@m.com' }),
    ins({ carrera: 'B', prueba: '10K', precio: 50, email: 'y@y.com' }),
  ]

  it('por recaudación', () => {
    const top = pruebasPorRecaudacion(rows)
    expect(top[0]).toMatchObject({ prueba: '21K', recaudacion: 200 })
  })

  it('por corredores', () => {
    const top = pruebasPorCorredores(rows)
    expect(top[0]).toMatchObject({ prueba: '10K', corredoresUnicos: 2 })
  })
})

describe('comparativaVsGlobal (M-25)', () => {
  const rows = [
    ins({ carrera: 'A', precio: 100, email: 'a1@x.com' }),
    ins({ carrera: 'A', precio: 100, email: 'a2@x.com' }),
    ins({ carrera: 'B', precio: 50, email: 'b1@x.com' }),
    ins({ carrera: 'C', precio: 50, email: 'c1@x.com' }),
  ]

  it('compara con la media del resto', () => {
    const comp = comparativaVsGlobal(rows, 'A||2024')
    const recaudacion = comp.find((c) => c.metrica === 'recaudacion')
    expect(recaudacion).toMatchObject({ carrera: 200, media: 50, diferenciaPct: 300 })
    const inscripciones = comp.find((c) => c.metrica === 'inscripciones')
    expect(inscripciones).toMatchObject({ carrera: 2, media: 1, diferenciaPct: 100 })
  })

  it('devuelve vacío si no encuentra la edición', () => {
    expect(comparativaVsGlobal(rows, 'ZZ||1999')).toEqual([])
  })
})

describe('desglosePruebas (M-26)', () => {
  it('calcula métricas por prueba', () => {
    const rows = [
      ins({ prueba: '10K', precio: 20 }),
      ins({ prueba: '10K', precio: 20, email: 'b@x.com' }),
      ins({ prueba: '21K', precio: 50, email: 'c@x.com' }),
    ]
    expect(desglosePruebas(rows)).toEqual([
      { nombre: '10K', inscripciones: 2, corredoresUnicos: 2, recaudacion: 40, ticketMedio: 20 },
      { nombre: '21K', inscripciones: 1, corredoresUnicos: 1, recaudacion: 50, ticketMedio: 50 },
    ])
  })
})

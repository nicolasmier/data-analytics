import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { Dashboard } from './Dashboard'
import { AppContext, type AppContextValue } from '../../state/store'
import type { Dataset, Inscripcion } from '../../domain/types'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  AreaChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => null,
  Legend: () => null,
}))

function ins(partial: Partial<Inscripcion>): Inscripcion {
  return {
    id: 'x',
    fechaInscripcion: new Date('2024-01-01'),
    anio: 2024,
    estado: 'CONFIRMADO',
    carrera: 'Carrera A',
    prueba: '10K',
    precio: 20,
    invitado: false,
    federado: null,
    nombre: 'Ana',
    apellidos: 'López',
    email: 'ana@x.com',
    corredorId: 'ana@x.com|ana|lopez',
    localidad: 'Oviedo',
    provincia: 'Asturias',
    pais: 'España',
    temporada: '2023-2024',
    esCarrera: true,
    ...partial,
  }
}

const dataset = {
  inscripciones: [
    ins({}),
    ins({ carrera: 'Carrera B', email: 'luis@x.com', corredorId: 'luis', nombre: 'Luis', apellidos: 'Ruiz' }),
  ],
  carreras: [],
  anios: [2024],
  temporadas: ['2023-2024'],
  noCarrerasList: [],
  report: {
    ficheros: 1,
    filasLeidas: 2,
    filasValidas: 2,
    noCarreras: 0,
    descartadas: 0,
    preciosNoNumericos: 0,
    estados: { CONFIRMADO: 2, ANULADO: 0, APLAZADO: 0, OTRO: 0 },
    carreras: 2,
    pruebas: 2,
    anios: [2024],
    temporadas: ['2023-2024'],
    warnings: [],
  },
} as unknown as Dataset

const contextValue: AppContextValue = {
  state: {
    status: 'ready',
    files: [],
    detectedMapping: null,
    mapping: null,
    dataset,
    includeNonCarrera: new Set(),
    error: null,
  },
  loadFiles: vi.fn(),
  applyMapping: vi.fn(),
  toggleNonCarrera: vi.fn(),
  reset: vi.fn(),
}

describe('Dashboard (integración con dataset mock)', () => {
  it('muestra KPIs y rankings coherentes', () => {
    render(
      <AppContext.Provider value={contextValue}>
        <Dashboard />
      </AppContext.Provider>,
    )

    expect(screen.getByText('Recaudación por año')).toBeInTheDocument()
    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.getByText('Top 10 corredores')).toBeInTheDocument()
    expect(screen.getByText('Carreras con más recaudación')).toBeInTheDocument()
    expect(screen.getByText('Procedencia por localidad')).toBeInTheDocument()
  })
})

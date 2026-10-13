export type CellValue = string | number | boolean | Date | null | undefined

export type Estado = 'CONFIRMADO' | 'ANULADO' | 'APLAZADO' | 'OTRO'

export type Inscripcion = {
  id: string
  idMultiple?: string
  fechaInscripcion: Date
  anio: number
  estado: Estado
  carrera: string
  prueba: string
  precio: number | null
  invitado: boolean
  federado: boolean | null
  dorsal?: string
  nombre: string
  apellidos: string
  email: string
  corredorId: string
  localidad: string
  provincia: string
  pais: string
  sexo?: string
  categoria?: string
  club?: string
  nacionalidad?: string
  temporada: string
  esCarrera: boolean
}

export type Prueba = {
  nombre: string
  inscripciones: number
  corredoresUnicos: number
  recaudacion: number
}

export type Carrera = {
  key: string
  nombre: string
  anio: number
  anioEstimado: boolean
  temporadas: string[]
  pruebas: Prueba[]
  inscripciones: number
  corredoresUnicos: number
  recaudacion: number
}

export type LoadReport = {
  ficheros: number
  filasLeidas: number
  filasValidas: number
  noCarreras: number
  descartadas: number
  preciosNoNumericos: number
  estados: Record<Estado, number>
  carreras: number
  pruebas: number
  anios: number[]
  temporadas: string[]
  warnings: string[]
}

export type Dataset = {
  inscripciones: Inscripcion[]
  carreras: Carrera[]
  anios: number[]
  temporadas: string[]
  noCarrerasList: NonCarreraEntry[]
  report: LoadReport
}

export type NonCarreraEntry = {
  nombre: string
  filas: number
}

export type RawTable = {
  header: string[]
  rows: CellValue[][]
}

export type ParsedFile = {
  fileName: string
  temporada: string
  table: RawTable
}

export type FieldName =
  | 'id'
  | 'idMultiple'
  | 'fechaInscripcion'
  | 'estado'
  | 'carrera'
  | 'prueba'
  | 'precio'
  | 'invitado'
  | 'federado'
  | 'dorsal'
  | 'nombre'
  | 'apellidos'
  | 'email'
  | 'localidad'
  | 'provincia'
  | 'pais'
  | 'sexo'
  | 'categoria'
  | 'club'
  | 'nacionalidad'

export type ColumnMapping = Record<FieldName, number | null>

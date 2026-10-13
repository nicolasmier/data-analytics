import type { ColumnMapping, FieldName } from './types'

export const FIELD_LABELS: Record<FieldName, string> = {
  id: 'ID inscripción',
  idMultiple: 'ID inscripción múltiple',
  fechaInscripcion: 'Fecha de inscripción',
  estado: 'Estado',
  carrera: 'Carrera (evento)',
  prueba: 'Prueba / modalidad',
  precio: 'Importe inscripción',
  invitado: 'Invitado',
  federado: 'Federado',
  dorsal: 'Dorsal',
  nombre: 'Nombre',
  apellidos: 'Apellidos',
  email: 'E-mail',
  localidad: 'Población',
  provincia: 'Provincia',
  pais: 'País',
  sexo: 'Sexo',
  categoria: 'Categoría',
  club: 'Club',
  nacionalidad: 'Nacionalidad',
}

const FIELD_ALIASES: Record<FieldName, string[]> = {
  id: ['ID INSCRIPCION', 'ID INSCRIPCIÓN'],
  idMultiple: ['ID INSCRIPCION MULTIPLE'],
  fechaInscripcion: ['FECHA INSCRIPCION', 'FECHA', 'DATE'],
  estado: ['ESTADO'],
  carrera: ['NOMBRE DEL EVENTO', 'EVENTO', 'CARRERA'],
  prueba: ['CUOTA INSCRIPCION', 'MODALIDAD', 'DISTANCIA', 'TARIFA'],
  precio: ['IMPORTE INSCRIPCION', 'IMPORTE', 'PRECIO', 'CUOTA', 'TOTAL'],
  invitado: ['INVITADO'],
  federado: ['FEDERADO'],
  dorsal: ['DORSAL'],
  nombre: ['NOMBRE'],
  apellidos: ['APELLIDOS'],
  email: ['E-MAIL', 'EMAIL', 'CORREO'],
  localidad: ['POBLACION', 'LOCALIDAD', 'CIUDAD', 'MUNICIPIO'],
  provincia: ['PROVINCIA', 'PROV'],
  pais: ['PAIS DE RESIDENCIA', 'PAIS'],
  sexo: ['SEXO'],
  categoria: ['CATEGORIA'],
  club: ['CLUB', 'EQUIPO'],
  nacionalidad: ['NACIONALIDAD'],
}

export const REQUIRED_FIELDS: FieldName[] = [
  'carrera',
  'fechaInscripcion',
  'precio',
  'nombre',
  'apellidos',
  'email',
]

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function detectMapping(header: string[]): ColumnMapping {
  const normalized = header.map(normalizeText)
  const mapping = {} as ColumnMapping

  for (const field of Object.keys(FIELD_ALIASES) as FieldName[]) {
    const aliases = FIELD_ALIASES[field].map(normalizeText)
    let index = normalized.findIndex((h) => aliases.includes(h))
    if (index === -1) {
      index = normalized.findIndex((h) => aliases.some((a) => h.includes(a)))
    }
    mapping[field] = index === -1 ? null : index
  }

  return mapping
}

export function missingRequiredFields(mapping: ColumnMapping): FieldName[] {
  return REQUIRED_FIELDS.filter((field) => mapping[field] == null)
}

export function autoMapping(header: string[]): { mapping: ColumnMapping; missing: FieldName[] } {
  const mapping = detectMapping(header)
  return { mapping, missing: missingRequiredFields(mapping) }
}

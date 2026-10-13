import { cleanKey } from './text'

const CONECTORES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o', 'u', 'al', 'a', 'en', 'da', 'do', 'das', 'dos', 'na', 'no'])

/** Aplica capitalización tipo español conservando los acentos. */
export function titleCaseEs(value: string): string {
  const lower = value.toLocaleLowerCase('es-ES')
  return lower
    .split(' ')
    .filter((part) => part !== '')
    .map((word, index) => {
      if (index > 0 && CONECTORES.has(word)) return word
      return word.charAt(0).toLocaleUpperCase('es-ES') + word.slice(1)
    })
    .join(' ')
}

/** Provincias/regiones canónicas indexadas por `cleanKey` (sin acentos, mayúsculas). */
export const PROVINCIAS: Record<string, string> = {
  ASTURIAS: 'Asturias',
  CANTABRIA: 'Cantabria',
  MADRID: 'Madrid',
  'A CORUNA': 'A Coruña',
  CORUNA: 'A Coruña',
  'LA CORUNA': 'A Coruña',
  LEON: 'León',
  PONTEVEDRA: 'Pontevedra',
  VALLADOLID: 'Valladolid',
  LUGO: 'Lugo',
  VIZCAYA: 'Vizcaya',
  BIZKAIA: 'Vizcaya',
  SORIA: 'Soria',
  BURGOS: 'Burgos',
  GUIPUZCOA: 'Guipúzcoa',
  GIPUZKOA: 'Guipúzcoa',
  ZAMORA: 'Zamora',
  BARCELONA: 'Barcelona',
  ZARAGOZA: 'Zaragoza',
  SALAMANCA: 'Salamanca',
  NAVARRA: 'Navarra',
  OURENSE: 'Ourense',
  PALENCIA: 'Palencia',
  ALAVA: 'Álava',
  ARABA: 'Álava',
  'LA RIOJA': 'La Rioja',
  VALENCIA: 'Valencia',
  ALICANTE: 'Alicante',
  ALACANT: 'Alicante',
  SEGOVIA: 'Segovia',
  TOLEDO: 'Toledo',
  MURCIA: 'Murcia',
  BALEARES: 'Baleares',
  ILLESBALEARS: 'Baleares',
  'ILLES BALEARS': 'Baleares',
  GUADALAJARA: 'Guadalajara',
  'SANTA CRUZ DE TENERIFE': 'Santa Cruz de Tenerife',
  MALAGA: 'Málaga',
  SEVILLA: 'Sevilla',
  CASTELLON: 'Castellón',
  AVILA: 'Ávila',
  'LAS PALMAS': 'Las Palmas',
  'PALMAS (LAS)': 'Las Palmas',
  LASPALMAS: 'Las Palmas',
  PALMAS: 'Las Palmas',
  'CIUDAD REAL': 'Ciudad Real',
  HUESCA: 'Huesca',
  CADIZ: 'Cádiz',
  CACERES: 'Cáceres',
  GRANADA: 'Granada',
  ALBACETE: 'Albacete',
  BADAJOZ: 'Badajoz',
  CUENCA: 'Cuenca',
  TARRAGONA: 'Tarragona',
  CORDOBA: 'Córdoba',
  ALMERIA: 'Almería',
  TERUEL: 'Teruel',
  GIRONA: 'Girona',
  GERONA: 'Girona',
  JAEN: 'Jaén',
  LLEIDA: 'Lleida',
  LERIDA: 'Lleida',
  HUELVA: 'Huelva',
  MELILLA: 'Melilla',
  CEUTA: 'Ceuta',
  'NO RESIDENTE': 'No residente',
  ANDORRA: 'Andorra',
  'PRINCIPADO ANDORRA': 'Andorra',
}

/** Unifica provincia/región: usa el nombre canónico si se reconoce; si no, capitaliza. */
export function canonicalProvincia(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim()
  if (text === '') return ''
  return PROVINCIAS[cleanKey(text)] ?? titleCaseEs(text)
}

/** Unifica la localidad con capitalización española. */
export function canonicalLocalidad(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim()
  if (text === '') return ''
  return titleCaseEs(text)
}

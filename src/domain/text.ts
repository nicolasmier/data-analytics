/** Normaliza texto para comparaciones: sin acentos, mayúsculas, espacios colapsados. */
export function cleanKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

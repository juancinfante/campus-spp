// Convierte un título en un slug legible para la URL: sin acentos, sin
// mayúsculas, espacios como guiones. Ej: "Cálculo II" -> "calculo-ii"
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

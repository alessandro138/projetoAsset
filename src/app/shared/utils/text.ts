/** Normaliza texto para busca: sem acentos, minúsculas e sem espaços nas pontas */
export function normalizeForSearch(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

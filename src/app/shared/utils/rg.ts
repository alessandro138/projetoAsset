// RG: o formato muda de estado para estado, então guardamos só os caracteres, sem pontos e traço.
// Até 12 caracteres, só dígitos; o último pode ser "X" (dígito verificador de alguns estados, ex.: SP).

export const RG_MAX_LENGTH = 12;
const RG_MIN_LENGTH = 5;

/** Deixa só dígitos e um "X" final, em maiúscula, com no máximo 12 caracteres */
export function normalizeRg(value: string): string {
  const chars = value.toUpperCase().replace(/[^0-9X]/g, '').slice(0, RG_MAX_LENGTH);
  // "X" só vale como último caractere
  return chars.slice(0, -1).replace(/X/g, '') + chars.slice(-1);
}

export function isValidRg(value: string): boolean {
  return new RegExp(`^[0-9]{${RG_MIN_LENGTH - 1},${RG_MAX_LENGTH - 1}}[0-9X]$`).test(value);
}

/** RG para listagens (LGPD): só os caracteres do meio aparecem, ex.: 12345678X → **34567*** */
export function maskRgForDisplay(value: string): string {
  const rg = normalizeRg(value);
  if (rg.length < RG_MIN_LENGTH) {
    return '*'.repeat(9);
  }
  return '**' + rg.slice(2, -3) + '***';
}

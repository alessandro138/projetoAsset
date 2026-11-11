// Regras e sugestão de senha para os usuários da área restrita

export const PASSWORD_MIN_LENGTH = 10;

const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?-_+=';

export interface PasswordRule {
  key: 'length' | 'lower' | 'upper' | 'digit' | 'symbol';
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'length', label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`, test: p => p.length >= PASSWORD_MIN_LENGTH },
  { key: 'lower', label: 'Uma letra minúscula', test: p => /[a-z]/.test(p) },
  { key: 'upper', label: 'Uma letra maiúscula', test: p => /[A-Z]/.test(p) },
  { key: 'digit', label: 'Um número', test: p => /\d/.test(p) },
  { key: 'symbol', label: 'Um símbolo (ex.: ! @ # $ %)', test: p => /[^A-Za-z0-9]/.test(p) },
];

export function unmetPasswordRules(password: string): PasswordRule[] {
  return PASSWORD_RULES.filter(rule => !rule.test(password));
}

/**
 * Senha aleatória forte, gerada no navegador (crypto.getRandomValues) e nunca enviada a lugar nenhum.
 * Tem ao menos um caractere de cada tipo e evita caracteres confundíveis (0/O, 1/l/I).
 */
export function generateSecurePassword(length = 16): string {
  const all = LOWER + UPPER + DIGITS + SYMBOLS;
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < Math.max(length, PASSWORD_MIN_LENGTH)) {
    chars.push(pick(all));
  }
  // Embaralha (Fisher-Yates) para os tipos obrigatórios não ficarem sempre no começo
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function pick(set: string): string {
  return set[randomInt(set.length)];
}

/** Inteiro uniforme em [0, max) sem viés de módulo */
function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

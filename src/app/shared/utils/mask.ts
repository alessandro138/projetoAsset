export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Formata dígitos segundo um padrão em que '0' é um dígito, ex.: '000.000.000-00'. Funciona com entrada parcial. */
export function applyPattern(value: string, pattern: string): string {
  const digits = onlyDigits(value);
  let result = '';
  let d = 0;
  for (const char of pattern) {
    if (d >= digits.length) {
      break;
    }
    if (char === '0') {
      result += digits[d++];
    } else {
      result += char;
    }
  }
  return result;
}

export type MaskType = 'cpf' | 'cep' | 'phone' | 'sus';

export function formatMask(value: string, type: MaskType): string {
  switch (type) {
    case 'cpf':
      return applyPattern(value, '000.000.000-00');
    case 'cep':
      return applyPattern(value, '00000-000');
    case 'sus':
      // Cartão Nacional de Saúde: 15 dígitos
      return applyPattern(value, '000 0000 0000 0000');
    case 'phone':
      // Fixo (10 dígitos) ou celular (11 dígitos)
      return onlyDigits(value).length > 10
        ? applyPattern(value, '(00) 00000-0000')
        : applyPattern(value, '(00) 0000-0000');
  }
}

import { onlyDigits } from './mask';

/** Valida tamanho, sequências repetidas (111.111.111-11) e dígitos verificadores. Aceita com ou sem máscara. */
export function isValidCpf(value: string | null | undefined): boolean {
  const cpf = onlyDigits(value ?? '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10]);
}

/** CPF parcialmente oculto para listagens (LGPD): ***.456.789-** */
export function maskCpfForDisplay(value: string): string {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) {
    return '***.***.***-**';
  }
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}

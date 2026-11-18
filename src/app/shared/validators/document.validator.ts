import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { onlyDigits } from '../utils/mask';
import { isValidRg, normalizeRg } from '../utils/rg';

/** RG: até 12 caracteres, só dígitos (o último pode ser X). Campo vazio é aceito. Erro: { rg: true } */
export function rgValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value as string | null) ?? '';
    if (!value.trim()) {
      return null;
    }
    return isValidRg(normalizeRg(value)) ? null : { rg: true };
  };
}

/**
 * No grupo da pessoa: exige CPF ou RG (ao menos um dos dois).
 * Erro no grupo: { documentRequired: true }
 */
export function documentRequiredValidator(cpfPath = 'cpf', rgPath = 'rg'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const cpf = onlyDigits((group.get(cpfPath)?.value as string | null) ?? '');
    const rg = normalizeRg((group.get(rgPath)?.value as string | null) ?? '');
    return cpf || rg ? null : { documentRequired: true };
  };
}

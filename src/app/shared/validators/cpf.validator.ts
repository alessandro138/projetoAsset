import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, map, of } from 'rxjs';

import { isValidCpf } from '../utils/cpf';
import { onlyDigits } from '../utils/mask';

/** Campo vazio é aceito: combine com Validators.required. Erro: { cpf: true } */
export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    return isValidCpf(value) ? null : { cpf: true };
  };
}

/**
 * Unicidade do CPF no cadastro. Recebe uma função que consulta a fonte de dados (hoje em memória, depois o backend)
 * com o CPF só com dígitos. Erro: { cpfTaken: true }
 */
export function cpfUniqueValidator(isTaken: (cpf: string) => Observable<boolean>): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value as string | null;
    if (!value || !isValidCpf(value)) {
      return of(null);
    }
    return isTaken(onlyDigits(value)).pipe(map(taken => (taken ? { cpfTaken: true } : null)));
  };
}

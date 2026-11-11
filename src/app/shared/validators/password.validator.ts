import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { unmetPasswordRules } from '../utils/password';

/** Senha forte (ver PASSWORD_RULES). Campo vazio é aceito: combine com Validators.required. Erro: { weakPassword: true } */
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    return unmetPasswordRules(value).length ? { weakPassword: true } : null;
  };
}

/** Validator de grupo: os dois campos têm o mesmo valor. Erro: { passwordMismatch: true } */
export function passwordsMatchValidator(field = 'password', confirmField = 'confirmPassword'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const confirm = group.get(confirmField)?.value as string;
    if (!confirm) {
      return null;
    }
    return group.get(field)?.value === confirm ? null : { passwordMismatch: true };
  };
}

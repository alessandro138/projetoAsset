import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { parseIsoDate } from '../utils/date';

/** Para grupos de checkboxes: exige ao menos um marcado. Erro: { atLeastOne: true } */
export function atLeastOneCheckedValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const values = Object.values(group.value as Record<string, boolean>);
    return values.some(Boolean) ? null : { atLeastOne: true };
  };
}

/** Data 'AAAA-MM-DD' válida e não futura. Campo vazio é aceito. Erros: { date: true } ou { futureDate: true } */
export function pastDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    const date = parseIsoDate(value);
    if (!date) {
      return { date: true };
    }
    return date.getTime() > Date.now() ? { futureDate: true } : null;
  };
}

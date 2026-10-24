import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { isMinor } from '../utils/date';

interface GuardianFormValue {
  birthDate?: string;
  types?: { beneficiario?: boolean };
  guardianId?: string | null;
}

/**
 * Validator de grupo: beneficiário menor de idade precisa de tutor legal cadastrado e maior de idade.
 * `getBirthDate` devolve a data de nascimento ('AAAA-MM-DD') de uma pessoa cadastrada pelo id.
 * Erros: { guardianRequired: true }, { guardianNotFound: true } ou { guardianMinor: true }
 */
export function guardianValidator(
  getBirthDate: (personId: string) => string | undefined,
  selfId: () => string | null = () => null,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const { birthDate, types, guardianId } = group.value as GuardianFormValue;
    const needsGuardian = !!types?.beneficiario && !!birthDate && isMinor(birthDate);

    if (!guardianId) {
      return needsGuardian ? { guardianRequired: true } : null;
    }
    const guardianBirthDate = guardianId === selfId() ? undefined : getBirthDate(guardianId);
    if (!guardianBirthDate) {
      return { guardianNotFound: true };
    }
    return isMinor(guardianBirthDate) ? { guardianMinor: true } : null;
  };
}

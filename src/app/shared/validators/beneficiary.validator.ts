import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { parseIsoDate } from '../utils/date';

interface BeneficiaryFormValue {
  types?: { beneficiario?: boolean };
  enrollment?: { startDate?: string; endDate?: string; modalityId?: string };
  imageConsent?: boolean | null;
}

/**
 * Validator de grupo com as regras da ficha de matrícula, aplicadas só a beneficiários:
 * início e modalidade obrigatórios, término não anterior ao início e resposta da autorização de imagem.
 * Erros: enrollmentStartRequired, modalityRequired, enrollmentEndBeforeStart, imageConsentRequired
 */
export function beneficiaryValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const { types, enrollment, imageConsent } = group.value as BeneficiaryFormValue;
    if (!types?.beneficiario) {
      return null;
    }
    const errors: ValidationErrors = {};
    if (!enrollment?.startDate) {
      errors['enrollmentStartRequired'] = true;
    }
    if (!enrollment?.modalityId) {
      errors['modalityRequired'] = true;
    }
    const start = parseIsoDate(enrollment?.startDate);
    const end = parseIsoDate(enrollment?.endDate);
    if (start && end && end < start) {
      errors['enrollmentEndBeforeStart'] = true;
    }
    if (imageConsent === null || imageConsent === undefined) {
      errors['imageConsentRequired'] = true;
    }
    return Object.keys(errors).length ? errors : null;
  };
}

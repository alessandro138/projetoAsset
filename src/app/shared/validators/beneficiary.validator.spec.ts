import { FormControl, FormGroup } from '@angular/forms';

import { beneficiaryValidator } from './beneficiary.validator';

describe('beneficiaryValidator', () => {
  function buildForm(
    beneficiario: boolean,
    enrollment: { startDate: string; endDate: string; modality: string },
    imageConsent: boolean | null,
  ) {
    return new FormGroup(
      {
        types: new FormGroup({ beneficiario: new FormControl(beneficiario) }),
        enrollment: new FormGroup({
          startDate: new FormControl(enrollment.startDate),
          endDate: new FormControl(enrollment.endDate),
          modality: new FormControl(enrollment.modality),
        }),
        imageConsent: new FormControl<boolean | null>(imageConsent),
      },
      { validators: beneficiaryValidator() },
    );
  }

  it('ignores people who are not beneficiaries', () => {
    expect(buildForm(false, { startDate: '', endDate: '', modality: '' }, null).errors).toBeNull();
  });

  it('requires start date, modality and an image consent answer', () => {
    expect(buildForm(true, { startDate: '', endDate: '', modality: ' ' }, null).errors).toEqual({
      enrollmentStartRequired: true,
      modalityRequired: true,
      imageConsentRequired: true,
    });
  });

  it('accepts "no" as an image consent answer', () => {
    expect(buildForm(true, { startDate: '2026-02-01', endDate: '', modality: 'Berçário' }, false).errors).toBeNull();
  });

  it('rejects an end date before the start date', () => {
    expect(
      buildForm(true, { startDate: '2026-02-01', endDate: '2026-01-31', modality: 'Berçário' }, true).errors,
    ).toEqual({ enrollmentEndBeforeStart: true });
  });
});

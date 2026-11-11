import { FormControl, FormGroup } from '@angular/forms';

import { beneficiaryValidator } from './beneficiary.validator';

describe('beneficiaryValidator', () => {
  function buildForm(
    beneficiario: boolean,
    enrollment: { startDate: string; endDate: string; modalityId: string },
    imageConsent: boolean | null,
  ) {
    return new FormGroup(
      {
        types: new FormGroup({ beneficiario: new FormControl(beneficiario) }),
        enrollment: new FormGroup({
          startDate: new FormControl(enrollment.startDate),
          endDate: new FormControl(enrollment.endDate),
          modalityId: new FormControl(enrollment.modalityId),
        }),
        imageConsent: new FormControl<boolean | null>(imageConsent),
      },
      { validators: beneficiaryValidator() },
    );
  }

  it('ignores people who are not beneficiaries', () => {
    expect(buildForm(false, { startDate: '', endDate: '', modalityId: '' }, null).errors).toBeNull();
  });

  it('requires start date, modality and an image consent answer', () => {
    expect(buildForm(true, { startDate: '', endDate: '', modalityId: '' }, null).errors).toEqual({
      enrollmentStartRequired: true,
      modalityRequired: true,
      imageConsentRequired: true,
    });
  });

  it('accepts "no" as an image consent answer', () => {
    expect(buildForm(true, { startDate: '2026-02-01', endDate: '', modalityId: 'm1' }, false).errors).toBeNull();
  });

  it('rejects an end date before the start date', () => {
    expect(
      buildForm(true, { startDate: '2026-02-01', endDate: '2026-01-31', modalityId: 'm1' }, true).errors,
    ).toEqual({ enrollmentEndBeforeStart: true });
  });
});

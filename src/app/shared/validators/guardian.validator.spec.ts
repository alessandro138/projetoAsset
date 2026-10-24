import { FormControl, FormGroup } from '@angular/forms';

import { guardianValidator } from './guardian.validator';

describe('guardianValidator', () => {
  const thisYear = new Date().getFullYear();
  const minorBirth = `${thisYear - 10}-01-01`;
  const adultBirth = `${thisYear - 40}-01-01`;
  const people: Record<string, string> = { adult: adultBirth, child: minorBirth };

  function buildForm(birthDate: string, beneficiario: boolean, guardianId: string | null, selfId: string | null = null) {
    return new FormGroup(
      {
        birthDate: new FormControl(birthDate),
        types: new FormGroup({ beneficiario: new FormControl(beneficiario) }),
        guardianId: new FormControl(guardianId),
      },
      { validators: guardianValidator(id => people[id], () => selfId) },
    );
  }

  it('requires a guardian for a minor beneficiary', () => {
    expect(buildForm(minorBirth, true, null).errors).toEqual({ guardianRequired: true });
  });

  it('accepts a minor beneficiary with an adult guardian', () => {
    expect(buildForm(minorBirth, true, 'adult').errors).toBeNull();
  });

  it('rejects a minor guardian', () => {
    expect(buildForm(minorBirth, true, 'child').errors).toEqual({ guardianMinor: true });
  });

  it('rejects an unknown guardian or the person themselves', () => {
    expect(buildForm(minorBirth, true, 'missing').errors).toEqual({ guardianNotFound: true });
    expect(buildForm(adultBirth, false, 'adult', 'adult').errors).toEqual({ guardianNotFound: true });
  });

  it('does not require a guardian for adults or non-beneficiaries', () => {
    expect(buildForm(adultBirth, true, null).errors).toBeNull();
    expect(buildForm(minorBirth, false, null).errors).toBeNull();
  });
});

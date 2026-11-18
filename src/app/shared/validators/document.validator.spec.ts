import { FormControl, FormGroup } from '@angular/forms';

import { documentRequiredValidator, rgValidator } from './document.validator';

describe('document validators', () => {
  it('accepts an empty RG, digits and a final X, up to 12 characters', () => {
    const validate = rgValidator();
    expect(validate(new FormControl(''))).toBeNull();
    expect(validate(new FormControl('12.345.678-9'))).toBeNull();
    expect(validate(new FormControl('12345678x'))).toBeNull();
    expect(validate(new FormControl('123456789012'))).toBeNull();
    expect(validate(new FormControl('123'))).toEqual({ rg: true });
  });

  it('requires CPF or RG, at least one of them', () => {
    const group = new FormGroup(
      { cpf: new FormControl(''), rg: new FormControl('') },
      { validators: documentRequiredValidator() },
    );
    expect(group.hasError('documentRequired')).toBeTrue();
    group.patchValue({ rg: '123456789' });
    expect(group.hasError('documentRequired')).toBeFalse();
    group.patchValue({ rg: '', cpf: '529.982.247-25' });
    expect(group.hasError('documentRequired')).toBeFalse();
  });
});

import { fakeAsync, tick } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { of } from 'rxjs';

import { cpfUniqueValidator, cpfValidator } from './cpf.validator';

describe('cpfValidator', () => {
  it('returns null for empty or valid values and an error for invalid ones', () => {
    const control = new FormControl('', [cpfValidator()]);
    expect(control.errors).toBeNull();

    control.setValue('529.982.247-25');
    expect(control.errors).toBeNull();

    control.setValue('111.111.111-11');
    expect(control.errors).toEqual({ cpf: true });
  });

  it('works together with required', () => {
    const control = new FormControl('', [Validators.required, cpfValidator()]);
    expect(control.hasError('required')).toBeTrue();
  });
});

describe('cpfUniqueValidator', () => {
  it('flags a CPF that is already registered, passing only digits to the lookup', fakeAsync(() => {
    const lookup = jasmine.createSpy('isTaken').and.returnValue(of(true));
    const control = new FormControl('529.982.247-25', { asyncValidators: [cpfUniqueValidator(lookup)] });
    tick();
    expect(lookup).toHaveBeenCalledWith('52998224725');
    expect(control.errors).toEqual({ cpfTaken: true });
  }));

  it('skips the lookup for invalid CPFs', fakeAsync(() => {
    const lookup = jasmine.createSpy('isTaken').and.returnValue(of(true));
    const control = new FormControl('123', { asyncValidators: [cpfUniqueValidator(lookup)] });
    tick();
    expect(lookup).not.toHaveBeenCalled();
    expect(control.errors).toBeNull();
  }));
});

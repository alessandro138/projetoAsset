import { isValidCpf, maskCpfForDisplay } from './cpf';

describe('isValidCpf', () => {
  it('accepts valid CPFs with or without mask', () => {
    expect(isValidCpf('529.982.247-25')).toBeTrue();
    expect(isValidCpf('52998224725')).toBeTrue();
    expect(isValidCpf('111.444.777-35')).toBeTrue();
  });

  it('rejects wrong check digits', () => {
    expect(isValidCpf('529.982.247-24')).toBeFalse();
    expect(isValidCpf('111.444.777-53')).toBeFalse();
  });

  it('rejects repeated sequences', () => {
    for (let d = 0; d <= 9; d++) {
      expect(isValidCpf(String(d).repeat(11))).withContext(String(d)).toBeFalse();
    }
  });

  it('rejects wrong length and empty values', () => {
    expect(isValidCpf('529.982.247-2')).toBeFalse();
    expect(isValidCpf('529982247251')).toBeFalse();
    expect(isValidCpf('')).toBeFalse();
    expect(isValidCpf(null)).toBeFalse();
  });
});

describe('maskCpfForDisplay', () => {
  it('hides the first three and the last two digits', () => {
    expect(maskCpfForDisplay('123.456.789-09')).toBe('***.456.789-**');
    expect(maskCpfForDisplay('12345678909')).toBe('***.456.789-**');
  });

  it('hides everything when the value is incomplete', () => {
    expect(maskCpfForDisplay('123')).toBe('***.***.***-**');
  });
});

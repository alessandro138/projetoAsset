import { isValidRg, maskRgForDisplay, normalizeRg } from './rg';
import { mainDocument, maskedMainDocument } from './document';

describe('rg utils', () => {
  it('keeps only digits and a final X, with at most 12 characters', () => {
    expect(normalizeRg('12.345.678-x')).toBe('12345678X');
    expect(normalizeRg('1X2345')).toBe('12345');
    expect(normalizeRg('1234567890123456')).toBe('123456789012');
  });

  it('validates the size and the X position', () => {
    expect(isValidRg('12345678X')).toBeTrue();
    expect(isValidRg('123456789012')).toBeTrue();
    expect(isValidRg('1234')).toBeFalse();
    expect(isValidRg('1234X5')).toBeFalse();
    expect(isValidRg('1234567890123')).toBeFalse();
  });

  it('masks the RG for listings', () => {
    expect(maskRgForDisplay('12345678X')).toBe('**3456***');
  });

  it('prefers the CPF as the main document', () => {
    expect(mainDocument({ cpf: '52998224725', rg: '12345678X' })).toEqual({ label: 'CPF', value: '529.982.247-25' });
    expect(mainDocument({ cpf: '', rg: '12345678X' })).toEqual({ label: 'RG', value: '12345678X' });
    expect(mainDocument({ cpf: '', rg: '' })).toBeNull();
    expect(maskedMainDocument({ cpf: '', rg: '12345678X' })).toEqual({ label: 'RG', value: '**3456***' });
    expect(maskedMainDocument({ cpf: '52998224725', rg: '1' })?.label).toBe('CPF');
  });
});

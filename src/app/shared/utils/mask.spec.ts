import { applyPattern, formatMask } from './mask';

describe('mask utils', () => {
  it('applies a pattern to partial input', () => {
    expect(applyPattern('1234', '000.000.000-00')).toBe('123.4');
    expect(applyPattern('12345678909', '000.000.000-00')).toBe('123.456.789-09');
  });

  it('ignores non-digits and extra digits', () => {
    expect(formatMask('123.456.789-0999', 'cpf')).toBe('123.456.789-09');
    expect(formatMask('70000a000', 'cep')).toBe('70000-000');
  });

  it('formats the SUS card number', () => {
    expect(formatMask('898001160409346', 'sus')).toBe('898 0011 6040 9346');
  });

  it('formats landline and mobile phones', () => {
    expect(formatMask('6133334444', 'phone')).toBe('(61) 3333-4444');
    expect(formatMask('61999998888', 'phone')).toBe('(61) 99999-8888');
  });
});

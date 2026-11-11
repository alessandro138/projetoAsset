import { ageOn, formatIsoDate, isMinor, parseIsoDate } from './date';

describe('date utils', () => {
  const today = new Date(2026, 9, 24); // 24/10/2026

  it('parses ISO dates as local dates', () => {
    const date = parseIsoDate('2010-03-05');
    expect(date?.getFullYear()).toBe(2010);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(5);
    expect(parseIsoDate('05/03/2010')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });

  it('formats ISO dates in the Brazilian format', () => {
    expect(formatIsoDate('2010-03-05')).toBe('05/03/2010');
    expect(formatIsoDate('')).toBe('');
  });

  it('computes age considering whether the birthday has passed', () => {
    expect(ageOn('2008-10-24', today)).toBe(18);
    expect(ageOn('2008-10-25', today)).toBe(17);
    expect(ageOn('invalid', today)).toBeNull();
  });

  it('flags minors', () => {
    expect(isMinor('2008-10-25', today)).toBeTrue();
    expect(isMinor('2008-10-24', today)).toBeFalse();
    expect(isMinor('', today)).toBeFalse();
  });
});

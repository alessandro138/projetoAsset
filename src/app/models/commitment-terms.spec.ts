import { commitmentTermFor, longDatePtBr } from './commitment-terms';

describe('commitment terms', () => {
  it('finds the term for Jiu-jítsu and Kickboxing, in any spelling', () => {
    expect(commitmentTermFor('Jiu-jítsu')?.key).toBe('jiu-jitsu');
    expect(commitmentTermFor('jiu jitsu')?.key).toBe('jiu-jitsu');
    expect(commitmentTermFor('JIU-JITSU infantil')?.key).toBe('jiu-jitsu');
    expect(commitmentTermFor('Kickboxing')?.key).toBe('kickboxing');
    expect(commitmentTermFor('Kick boxing')?.key).toBe('kickboxing');
  });

  it('has no term for other modalities', () => {
    expect(commitmentTermFor('Ballet')).toBeNull();
    expect(commitmentTermFor('')).toBeNull();
    expect(commitmentTermFor(undefined)).toBeNull();
  });

  it('writes the date in full, in Portuguese', () => {
    expect(longDatePtBr(new Date(2026, 10, 11))).toBe('11 de novembro de 2026');
    expect(longDatePtBr(new Date(2027, 2, 1))).toBe('1 de março de 2027');
  });
});

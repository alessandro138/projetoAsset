import { normalizeForSearch } from './text';

describe('normalizeForSearch', () => {
  it('ignores accents, case and surrounding spaces', () => {
    expect(normalizeForSearch('  João DA Conceição ')).toBe('joao da conceicao');
  });

  it('treats null and undefined as empty', () => {
    expect(normalizeForSearch(null)).toBe('');
    expect(normalizeForSearch(undefined)).toBe('');
  });
});

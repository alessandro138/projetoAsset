import { formatAddress } from './address';

describe('formatAddress', () => {
  it('joins the filled parts in one line', () => {
    expect(
      formatAddress({
        cep: '02879080',
        street: 'Rua Emílio Castro',
        number: '423',
        complement: '',
        district: 'Jardim Damasceno',
        city: 'São Paulo',
        state: 'SP',
      }),
    ).toBe('Rua Emílio Castro, 423 – Jardim Damasceno – São Paulo/SP – CEP 02879-080');
  });

  it('returns an empty string without address', () => {
    expect(formatAddress(null)).toBe('');
  });
});

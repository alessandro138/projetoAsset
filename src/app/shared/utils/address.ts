import { Address } from '../../models/person.model';
import { formatMask } from './mask';

/** Endereço numa linha: 'Rua X, 10, apto 2 – Bairro – Cidade/UF – CEP 00000-000' (partes vazias são omitidas) */
export function formatAddress(address: Address | null | undefined): string {
  if (!address) {
    return '';
  }
  const street = [address.street, address.number, address.complement].filter(Boolean).join(', ');
  const city = [address.city, address.state].filter(Boolean).join('/');
  const cep = address.cep ? `CEP ${formatMask(address.cep, 'cep')}` : '';
  return [street, address.district, city, cep].filter(Boolean).join(' – ');
}

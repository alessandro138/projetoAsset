// Documento de identificação da pessoa: CPF e/ou RG (ao menos um é obrigatório).
// Na ficha impressa e nas listagens aparece um só: o CPF tem preferência.

import { maskCpfForDisplay } from './cpf';
import { formatMask } from './mask';
import { maskRgForDisplay, normalizeRg } from './rg';

export interface PersonDocument {
  label: 'CPF' | 'RG';
  value: string;
}

interface HasDocuments {
  cpf: string;
  rg: string;
}

/** CPF formatado; sem CPF, o RG; sem nenhum dos dois, null */
export function mainDocument(person: HasDocuments): PersonDocument | null {
  if (person.cpf) {
    return { label: 'CPF', value: formatMask(person.cpf, 'cpf') };
  }
  if (person.rg) {
    return { label: 'RG', value: normalizeRg(person.rg) };
  }
  return null;
}

/** Mesmo documento de mainDocument, mascarado para listagens (LGPD) */
export function maskedMainDocument(person: HasDocuments): PersonDocument | null {
  if (person.cpf) {
    return { label: 'CPF', value: maskCpfForDisplay(person.cpf) };
  }
  if (person.rg) {
    return { label: 'RG', value: maskRgForDisplay(person.rg) };
  }
  return null;
}

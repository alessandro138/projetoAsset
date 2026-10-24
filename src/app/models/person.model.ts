// Pessoas ligadas aos projetos/atividades, sem acesso ao sistema. Novos campos serão adicionados:
// ao estender, atualize também o formulário (person-form) e o mapeamento toPerson/toFormValue.

export type PersonType = 'condutor' | 'beneficiario' | 'tutor';

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  condutor: 'Condutor',
  beneficiario: 'Beneficiário',
  tutor: 'Tutor legal',
};

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

export interface Person {
  id: string;
  fullName: string;
  /** Somente dígitos */
  cpf: string;
  /** 'AAAA-MM-DD' */
  birthDate: string;
  /** Somente dígitos */
  phone: string;
  address: Address;
  types: PersonType[];
  /** Obrigatório para beneficiário menor de idade; aponta para outra pessoa maior de idade */
  guardianId: string | null;
  /** Consentimento LGPD (dado pelo tutor legal, no caso de menores) */
  consentGiven: boolean;
}

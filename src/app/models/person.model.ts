// Pessoas ligadas aos projetos/atividades, sem acesso ao sistema. Novos campos serão adicionados:
// ao estender, atualize também o formulário (person-form), o mapeamento toPerson/toFormValue
// e, se o campo for da ficha de matrícula, o componente enrollment-sheet.

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

export const GUARDIAN_RELATIONSHIPS = ['Mãe', 'Pai', 'Avó', 'Avô', 'Tia', 'Tio', 'Irmã', 'Irmão', 'Outro'];

/** Matrícula do beneficiário (ficha de matrícula) */
export interface Enrollment {
  /** 'AAAA-MM-DD' */
  startDate: string;
  /** 'AAAA-MM-DD'; vazio enquanto a matrícula estiver ativa */
  endDate: string;
  /** Id em modalidades_servicos */
  modalityId: string;
  /** Nome da modalidade (para exibir e imprimir) */
  modality: string;
}

/** Modalidade oferecida pela ASSET (no banco: tabela modalidades_servicos) */
export interface Modality {
  id: string;
  name: string;
  /** Inativas não aparecem para novas matrículas */
  active: boolean;
}

export type VaccinationStatus = 'atualizado' | 'atrasado' | 'sem-informacao';
export type LivesWith = 'mae-e-pai' | 'pai' | 'mae' | 'outros';
export type BirthType = 'normal' | 'cesarea' | 'forceps' | 'prematuro';

export const VACCINATION_LABELS: Record<VaccinationStatus, string> = {
  atualizado: 'Atualizado',
  atrasado: 'Atrasado',
  'sem-informacao': 'Sem informação',
};

export const LIVES_WITH_LABELS: Record<LivesWith, string> = {
  'mae-e-pai': 'Mãe e Pai',
  pai: 'Pai',
  mae: 'Mãe',
  outros: 'Outros',
};

export const BIRTH_TYPE_LABELS: Record<BirthType, string> = {
  normal: 'Normal',
  cesarea: 'Cesárea',
  forceps: 'Fórceps',
  prematuro: 'Prematuro',
};

/** Perguntas Sim/Não da ficha de saúde, na ordem do formulário em papel */
export const HEALTH_QUESTIONS = [
  { key: 'developmentDelay', label: 'Teve atraso no desenvolvimento?' },
  { key: 'growthDelay', label: 'Teve atraso no crescimento?' },
  { key: 'heartProblem', label: 'Teve ou tem problema no coração?' },
  { key: 'medicalFollowUp', label: 'Faz acompanhamento médico?' },
  { key: 'disability', label: 'Possui alguma deficiência?' },
  { key: 'prosthesis', label: 'Usa alguma prótese?' },
  { key: 'faintingOrSeizure', label: 'Tem ou teve desmaio ou convulsão?' },
  { key: 'medication', label: 'Toma alguma medicação?' },
  { key: 'fracture', label: 'Já teve alguma fratura?' },
  { key: 'walkingDifficulty', label: 'Tem dificuldades para caminhar?' },
  { key: 'surgery', label: 'Já se submeteu a alguma cirurgia?' },
  { key: 'weightProblem', label: 'Tem problema com peso?' },
  { key: 'hospitalized', label: 'Já esteve internado?' },
  { key: 'specializedTreatment', label: 'Faz algum tratamento especializado?' },
  { key: 'allergy', label: 'Possui alguma alergia? Medicamento? Alimento?' },
] as const;

export type HealthQuestionKey = (typeof HEALTH_QUESTIONS)[number]['key'];

export interface HealthAnswer {
  /** null: não respondida */
  answer: boolean | null;
  /** Detalhe quando a resposta é "Sim" (qual medicação, qual alergia...) */
  details: string;
}

/** Ficha de saúde do beneficiário. Dado pessoal sensível (LGPD, art. 11): acesso restrito */
export interface HealthRecord {
  ubsRegistration: string;
  nearestHealthUnit: string;
  hasHealthInsurance: boolean | null;
  healthInsuranceName: string;
  vaccination: VaccinationStatus | null;
  livesWith: LivesWith | null;
  livesWithOther: string;
  birthType: BirthType | null;
  answers: Record<HealthQuestionKey, HealthAnswer>;
}

export interface Person {
  id: string;
  fullName: string;
  /** Somente dígitos; vazio quando a pessoa só tem RG (ao menos um dos dois é obrigatório) */
  cpf: string;
  /** RG sem pontos e traço (até 12 caracteres; o último pode ser X); vazio quando não informado */
  rg: string;
  /** 'AAAA-MM-DD' */
  birthDate: string;
  /** Nacionalidade, ex.: 'Brasileira' */
  nationality: string;
  birthCity: string;
  birthState: string;
  /** Somente dígitos */
  susCard: string;
  /** Celular/WhatsApp, somente dígitos */
  phone: string;
  address: Address;
  /** Foto 3x4 (data URL) */
  photo: string;
  types: PersonType[];
  /** Obrigatório para beneficiário menor de idade; aponta para outra pessoa maior de idade */
  guardianId: string | null;
  guardianRelationship: string;
  /** Só para beneficiários */
  enrollment: Enrollment | null;
  /** Só para beneficiários */
  health: HealthRecord | null;
  /** Autorização de uso de imagem e voz; null: não respondida */
  imageConsent: boolean | null;
  /** Consentimento LGPD (dado pelo tutor legal, no caso de menores) */
  consentGiven: boolean;
  /** Data/hora do cadastro (ISO); preenchida pelo banco, o formulário não altera */
  createdAt?: string;
  /** Data/hora da desativação (ISO); vazio/ausente = cadastro ativo. Quem desativou fica só no banco */
  deactivatedAt?: string | null;
}

export function emptyHealthRecord(): HealthRecord {
  return {
    ubsRegistration: '',
    nearestHealthUnit: '',
    hasHealthInsurance: null,
    healthInsuranceName: '',
    vaccination: null,
    livesWith: null,
    livesWithOther: '',
    birthType: null,
    answers: Object.fromEntries(
      HEALTH_QUESTIONS.map(q => [q.key, { answer: null, details: '' }]),
    ) as Record<HealthQuestionKey, HealthAnswer>,
  };
}

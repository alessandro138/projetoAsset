// Conversão entre o modelo do Angular (inglês, camelCase) e as tabelas do banco (português, snake_case).
// Strings vazias do formulário viram null no banco, e null volta como string vazia.

import {
  BirthType,
  Enrollment,
  HealthAnswer,
  HealthQuestionKey,
  HealthRecord,
  LivesWith,
  Person,
  PersonType,
  VaccinationStatus,
  emptyHealthRecord,
} from '../models/person.model';

export interface PessoaRow {
  id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  naturalidade: string | null;
  cidade_nascimento: string | null;
  uf_nascimento: string | null;
  cartao_sus: string | null;
  celular: string | null;
  endereco_cep: string | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  foto_caminho: string | null;
  eh_condutor: boolean;
  eh_beneficiario: boolean;
  eh_tutor: boolean;
  responsavel_id: string | null;
  grau_parentesco: string | null;
  autoriza_imagem: boolean | null;
  consentimento_lgpd: boolean;
}

export interface MatriculaRow {
  id: string;
  pessoa_id: string;
  data_inicio: string;
  data_termino: string | null;
  modalidade: string;
}

export interface FichaSaudeRow {
  pessoa_id: string;
  matricula_ubs: string | null;
  unidade_saude_proxima: string | null;
  possui_convenio: boolean | null;
  nome_convenio: string | null;
  calendario_vacinal: VaccinationStatus | null;
  vive_com: LivesWith | null;
  vive_com_outros: string | null;
  tipo_parto: BirthType | null;
  respostas: Partial<Record<HealthQuestionKey, HealthAnswer>>;
}

/** Colunas editáveis de pessoas (sem id, foto e campos de controle) */
export type PessoaInput = Omit<PessoaRow, 'id' | 'foto_caminho'>;
export type MatriculaInput = Omit<MatriculaRow, 'id' | 'pessoa_id'>;
export type FichaSaudeInput = Omit<FichaSaudeRow, 'pessoa_id'>;

function nullIfEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function toPessoaInput(person: Omit<Person, 'id'>): PessoaInput {
  return {
    nome_completo: person.fullName.trim(),
    cpf: person.cpf,
    data_nascimento: person.birthDate,
    naturalidade: nullIfEmpty(person.nationality),
    cidade_nascimento: nullIfEmpty(person.birthCity),
    uf_nascimento: nullIfEmpty(person.birthState),
    cartao_sus: nullIfEmpty(person.susCard),
    celular: nullIfEmpty(person.phone),
    endereco_cep: nullIfEmpty(person.address.cep),
    endereco_logradouro: nullIfEmpty(person.address.street),
    endereco_numero: nullIfEmpty(person.address.number),
    endereco_complemento: nullIfEmpty(person.address.complement),
    endereco_bairro: nullIfEmpty(person.address.district),
    endereco_cidade: nullIfEmpty(person.address.city),
    endereco_uf: nullIfEmpty(person.address.state),
    eh_condutor: person.types.includes('condutor'),
    eh_beneficiario: person.types.includes('beneficiario'),
    eh_tutor: person.types.includes('tutor'),
    responsavel_id: person.guardianId,
    grau_parentesco: person.guardianId ? nullIfEmpty(person.guardianRelationship) : null,
    autoriza_imagem: person.imageConsent,
    consentimento_lgpd: person.consentGiven,
  };
}

export function toMatriculaInput(enrollment: Enrollment): MatriculaInput {
  return {
    data_inicio: enrollment.startDate,
    data_termino: nullIfEmpty(enrollment.endDate),
    modalidade: enrollment.modality.trim(),
  };
}

export function toFichaSaudeInput(health: HealthRecord): FichaSaudeInput {
  return {
    matricula_ubs: nullIfEmpty(health.ubsRegistration),
    unidade_saude_proxima: nullIfEmpty(health.nearestHealthUnit),
    possui_convenio: health.hasHealthInsurance,
    nome_convenio: health.hasHealthInsurance ? nullIfEmpty(health.healthInsuranceName) : null,
    calendario_vacinal: health.vaccination,
    vive_com: health.livesWith,
    vive_com_outros: health.livesWith === 'outros' ? nullIfEmpty(health.livesWithOther) : null,
    tipo_parto: health.birthType,
    respostas: health.answers,
  };
}

/**
 * Monta a pessoa a partir das linhas do banco.
 * `matricula`: a mais recente; `photoUrl`: link temporário da foto no Storage.
 */
export function fromRows(
  row: PessoaRow,
  matricula: MatriculaRow | null,
  ficha: FichaSaudeRow | null,
  photoUrl: string,
): Person {
  const types: PersonType[] = [];
  if (row.eh_condutor) types.push('condutor');
  if (row.eh_beneficiario) types.push('beneficiario');
  if (row.eh_tutor) types.push('tutor');

  const empty = emptyHealthRecord();
  return {
    id: row.id,
    fullName: row.nome_completo,
    cpf: row.cpf,
    birthDate: row.data_nascimento,
    nationality: row.naturalidade ?? '',
    birthCity: row.cidade_nascimento ?? '',
    birthState: row.uf_nascimento ?? '',
    susCard: row.cartao_sus ?? '',
    phone: row.celular ?? '',
    address: {
      cep: row.endereco_cep ?? '',
      street: row.endereco_logradouro ?? '',
      number: row.endereco_numero ?? '',
      complement: row.endereco_complemento ?? '',
      district: row.endereco_bairro ?? '',
      city: row.endereco_cidade ?? '',
      state: row.endereco_uf ?? '',
    },
    photo: photoUrl,
    types,
    guardianId: row.responsavel_id,
    guardianRelationship: row.grau_parentesco ?? '',
    enrollment: matricula
      ? { startDate: matricula.data_inicio, endDate: matricula.data_termino ?? '', modality: matricula.modalidade }
      : null,
    health: ficha
      ? {
          ubsRegistration: ficha.matricula_ubs ?? '',
          nearestHealthUnit: ficha.unidade_saude_proxima ?? '',
          hasHealthInsurance: ficha.possui_convenio,
          healthInsuranceName: ficha.nome_convenio ?? '',
          vaccination: ficha.calendario_vacinal,
          livesWith: ficha.vive_com,
          livesWithOther: ficha.vive_com_outros ?? '',
          birthType: ficha.tipo_parto,
          // Perguntas novas, que ainda não existiam quando a ficha foi salva, ficam em branco
          answers: { ...empty.answers, ...ficha.respostas },
        }
      : null,
    imageConsent: row.autoriza_imagem,
    consentGiven: row.consentimento_lgpd,
  };
}

// Termos de compromisso das modalidades de luta. Textos iguais aos termos em papel da ASSET
// (Termo_Jiu-Jitsu.pdf e Termo_Kickboxing.pdf). O nome do aluno entra no lugar do "Eu, ____".

export interface CommitmentTerm {
  key: 'jiu-jitsu' | 'kickboxing';
  /** Nome da modalidade, usado na tela */
  modality: string;
  /** Título impresso (o termo de Jiu-jítsu em papel não tem título) */
  title: string | null;
  /** Continuação do 1º parágrafo, depois de "Eu, <nome>," */
  opening: string;
  paragraphs: string[];
  /** Trecho do nome da modalidade (sem acentos, só letras) que indica o termo */
  matches: string;
}

export const COMMITMENT_TERMS: CommitmentTerm[] = [
  {
    key: 'jiu-jitsu',
    modality: 'Jiu-jítsu',
    title: null,
    matches: 'jiujitsu',
    opening:
      'aluno (a) matriculado (a) na unidade acima descrita, declaro ciente das orientações do esporte JIU-JITSU desenvolvida pelo professor MICHAEL DOS SANTOS e RICHARD FRAGA, compreendo que utilizar as técnicas de JIU-JITSU para violência em qualquer ambiente dentro ou fora do tatame acarretará a consequência, como advertência e/ou suspensão da atividade. Estou ciente que os valores que permeiam a arte marcial JIU-JITSU são acima da aprendizagem de técnicas, grau, graduação ou participação em campeonatos. Os valores são a essência dos projetos de responsabilidade social, comprometo-me estar devidamente vestido e limpo conforme orientação dos professores.',
    paragraphs: [
      'Diante disso sou único responsável de ser modelo para meus companheiros, carregando comigo empatia, respeito pelo próximo, ética e responsabilidade.',
    ],
  },
  {
    key: 'kickboxing',
    modality: 'Kickboxing',
    title: 'TERMO DE COMPROMISSO',
    matches: 'kickboxing',
    opening:
      'aluno (a) matriculado (a) na Unidade acima descrita, declaro ciente das orientações e regras do esporte KICKBOXING desenvolvido pelo instrutor Moyses Pereira, coordenado pela gestora Adria. Compreendo que utilizar as técnicas de Kickboxing para violência em qualquer ambiente dentro ou fora do tatame acarretará consequências, como advertências e/ou suspensão da atividade. Estou ciente que os valores que permeiam a arte marcial KICKBOXING (COMBATE) são acima da aprendizagem de técnica, grau, graduação ou participações em campeonatos. Os valores são a essência dos projetos de responsabilidade social. Comprometo-me estar devidamente vestido e limpo conforme orientação do professor.',
    paragraphs: [
      'Diante disso sou único responsável de ser modelo para meus companheiros, carregando comigo empatia, respeito pelo próximo, ética e responsabilidade.',
    ],
  },
];

/** Termo de compromisso exigido pela modalidade (Jiu-jítsu ou Kickboxing), ou null */
export function commitmentTermFor(modality: string | null | undefined): CommitmentTerm | null {
  const normalized = (modality ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  if (!normalized) {
    return null;
  }
  return COMMITMENT_TERMS.find(term => normalized.includes(term.matches)) ?? null;
}

/** "11 de novembro de 2026" (data por extenso, como no "São Paulo, __ de __ de 202_") */
export function longDatePtBr(date: Date): string {
  const month = date.toLocaleDateString('pt-BR', { month: 'long' });
  return `${date.getDate()} de ${month} de ${date.getFullYear()}`;
}

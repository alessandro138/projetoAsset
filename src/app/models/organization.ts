// Dados da associação impressos nos documentos (ficha de matrícula). Textos iguais aos da ficha em papel.
// TODO: tornar editável pelo administrador junto com o conteúdo do site.

export const ORGANIZATION = {
  shortName: 'ASSET',
  name: 'Associação Educar Para Transformar',
  legalName: 'ASSET – ASSOCIAÇÃO EDUCAR PARA TRANSFORMAR',
  unit: 'MATRIZ – Nossa Casa ASSET',
  cnpj: '58.106.972/0001-45',
  logoUrl: 'logo-asset.png',
  /** Rodapé dos termos de compromisso (igual ao papel) */
  termFooter: [
    'Rua Emilio Castro, 423 — Jardim Damasceno — São Paulo/SP — CEP: 02879-080',
    'asset.educarparatransformar@gmail.com • (11) 3924-6076 • @asset.educar',
  ],
};

export const IMAGE_AUTHORIZATION_TEXT = [
  `Declaro que autorizo o uso de imagem e voz, em todo e qualquer material entre fotos, documentos e outros meios de comunicação, e institucionais deste instituto, por a ${ORGANIZATION.legalName}, inscrita no CNPJ ${ORGANIZATION.cnpj}, sejam essas destinadas à divulgação ao público em geral e/ou apenas para uso desta empresa, e desde que não haja desvirtuamento da sua finalidade.`,
  'A presente autorização é concedida a título gratuito, abrangendo o uso da imagem acima mencionada em todo território nacional e no exterior, sob qualquer forma e meios, ou sejam, em destaque: (I) out-door; (II) bus-door; folhetos em geral (encartes, mala direta, catálogo, etc.); (III) folder de apresentação; (IV) anúncios em revistas e jornais em geral; (V) home page; (VI) cartazes; (VII) back-light; (VIII) mídia eletrônica (painéis, vídeo-tapes, televisão, cinema, programa para rádio, entre outros).',
];

export const LGPD_AUTHORIZATION_TEXT = `Autorizo que a ${ORGANIZATION.legalName}, inscrita no CNPJ ${ORGANIZATION.cnpj}, disponham dos dados disponibilizados, de acordo com os artigos 7° e 11 da Lei n° 13.709/2018, para tratamento, como finalidade, de realização de Atividades de fortalecimento de Rede sócio assistencial, de modo que, o armazenamento destes dados será realizado respeitando as diretrizes da Lei Geral de Proteção de Dados (LGPD).`;

import { SiteContent } from '../models/site-content.model';

// Conteúdo inicial, extraído do site atual da associação (https://educaretransformar.org.br/) em 24/10/2026.
// Será substituído pelo conteúdo cadastrado pelo administrador nas telas administrativas.
const OLD_SITE = 'https://educaretransformar.org.br';

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    badge: 'Organização da Sociedade Civil',
    subtitle: 'ASSET',
    title: 'Associação Educar Para Transformar',
    imageUrl: 'logo-asset.png',
    imageAlt: 'Logo da ASSET - Associação Educar Para Transformar',
    primaryAction: { label: 'Destaques', href: '#destaques' },
    secondaryAction: { label: 'Sobre nós', href: '#sobre' },
  },
  highlights: {
    title: 'Destaques',
    items: [
      {
        id: 'festa-das-cores',
        title: 'Festa das Cores – 4º Unificada ASSET',
        date: '2022-09-02',
        imageUrl: 'images/noticias/festa-das-cores.jpg',
        link: `${OLD_SITE}/2022/09/02/festa-das-cores-4o-unificada-asset/`,
      },
      {
        id: 'programa-elabora',
        title: 'Programa Elabora – Fundação Paulistana',
        date: '2022-05-05',
        imageUrl: 'images/noticias/programa-elabora.jpg',
        link: `${OLD_SITE}/2022/05/05/programa-elabora-fundacao-paulistana/`,
      },
      {
        id: 'minha-biblioteca',
        title: 'Programa Minha Biblioteca\\SME',
        date: '2021-08-31',
        imageUrl: 'images/noticias/minha-biblioteca.jpg',
        link: `${OLD_SITE}/2021/08/31/programa-minha-bibliotecasme/`,
      },
    ],
  },
  news: {
    title: 'Últimas notícias',
    items: [
      {
        id: 'viajando-na-leitura',
        title: 'Projeto Viajando na Leitura',
        date: '2023-08-14',
        imageUrl: 'images/noticias/viajando-na-leitura.jpg',
        link: `${OLD_SITE}/2023/08/14/projeto-viajando-na-leitura/`,
      },
      {
        id: 'festa-das-cores-noticia',
        title: 'Festa das Cores – 4º Unificada ASSET',
        date: '2022-09-02',
        imageUrl: 'images/noticias/festa-das-cores.jpg',
        link: `${OLD_SITE}/2022/09/02/festa-das-cores-4o-unificada-asset/`,
      },
      {
        id: 'programa-elabora-noticia',
        title: 'Programa Elabora – Fundação Paulistana',
        date: '2022-05-05',
        imageUrl: 'images/noticias/programa-elabora.jpg',
        link: `${OLD_SITE}/2022/05/05/programa-elabora-fundacao-paulistana/`,
      },
      {
        id: 'ubs-silmaria',
        title: 'Ação do UBS Silmaria para atendimento a pacientes com diabetes tipo 1 e 2',
        date: '2022-02-21',
        imageUrl: 'images/noticias/ubs-silmaria.jpg',
        link: `${OLD_SITE}/2022/02/21/acao-do-ubs-silmaria-para-atendimento-a-pacientes-com-diabetes-tipo-1-e-2/`,
      },
      {
        id: 'doacao-grupo-toriba',
        title: 'Doação – Grupo Toriba',
        date: '2022-01-19',
        imageUrl: 'images/noticias/doacao-grupo-toriba.jpg',
        link: `${OLD_SITE}/2022/01/19/doacao-grupo-toriba/`,
      },
      {
        id: 'gratidao-grupo-toriba',
        title: 'Gratidão ao Grupo Toriba',
        date: '2022-01-12',
        imageUrl: 'images/noticias/gratidao-grupo-toriba.jpg',
        link: `${OLD_SITE}/2022/01/12/gratidao-ao-grupo-toriba/`,
      },
    ],
  },
  about: {
    title: 'Sobre nós',
    paragraphs: [
      'A ASSET – Associação Educar Para Transformar fundada em 30 de setembro ano de 1987, no bairro Jardim Elisa Maria, Distrito da Brasilândia na cidade de São Paulo, nos primeiros anos, de sua existência, ainda como Creche Habitacional Ângelo Lucena passou por inúmeros percalços e desafios, principalmente por falta de recursos financeiros, mesmo assim com coragem e arrojo, souberam a cada momento buscar as melhores soluções para os problemas enfrentados e, dessa forma, contribuíram para o atendimento de centenas de famílias que ficavam desabrigadas em consequências de alagamentos e desmoronamentos, ou ainda as que chegavam de outras regiões do país em condições de extrema vulnerabilidade.',
      'Atendendo as necessidades dos associados, a direção da entidade trabalhou muito para colocar à disposição atividades como cursos de cabeleireiro, corte e costura e informática, nos anos de 2000 a 2010, que foi o último nessa configuração. Já no ano 2011 como ASSET-Associação Educar Para Transformar passou a atender a grande demanda da educação infantil, proporcionando um atendimento de qualidade as familias carentes que estavam formalmente empregadas e não tinham aonde deixar seus filhos, preparando-as para a construção de um projeto de vida, realização pessoal e-profissional.',
      'Desde então, a ASSET vem trabalhando intensamente, apoiado no Sistema, que se firma no Espirito, na Razão, na Liberdade e na Democracia para o desenvolvimento harmonioso do ser humano.',
    ],
    pillars: [
      {
        icon: 'bi-bullseye',
        title: 'Missão',
        text: 'A ASSET tem por missão, promover o desenvolvimento harmonioso do ser humano, elevando a qualidade de vida através da promoção de atividades educacionais, culturais, lazer e o exercício de cidadania no Brasil.',
      },
      {
        icon: 'bi-eye-fill',
        title: 'Visão',
        text: 'Ser reconhecida como uma entidade conceituada de defesa do desenvolvimento humano eficiente, que seus sócios e o cidadão possam empreender mudanças, visando o desenvolvimento pleno de suas habilidades humanas.',
      },
      {
        icon: 'bi-heart-fill',
        title: 'Valores',
        text: 'Respeito aos sócios e parceiros, ética, Responsabilidade, solidariedade, democracia, transparência. coragem para melhorar a vida humana, liberdade, trabalho em equipe e fé em Deus e na vida.',
      },
    ],
    action: { label: 'Saiba mais', href: `${OLD_SITE}/saiba-mais/` },
  },
  contact: {
    title: 'Dúvidas ou sugestões?',
    text: 'Fale com o Escritório Administrativo ASSET.',
    email: 'asset.educarparatransformar@gmail.com',
    officeName: 'Escritório Administrativo ASSET',
    address: 'Rua Teodoro Ricardo, 170 – São Paulo/SP',
    phones: ['(11) 3924-6076', '(11) 3924-0019'],
  },
  partners: {
    title: 'Parceiros',
    items: [
      { name: 'Fundo Social São Paulo', logoUrl: 'images/parceiros/fundo-social-sp.png', url: '' },
      { name: 'Cacau Show', logoUrl: 'images/parceiros/cacau-show.png', url: '' },
      { name: 'idehm – Tecnologia e Inovação Sustentável', logoUrl: 'images/parceiros/idehm.jpg', url: '' },
      { name: 'Cidade Solidária', logoUrl: 'images/parceiros/cidade-solidaria.png', url: '' },
      { name: 'Karvi', logoUrl: 'images/parceiros/karvi.jpg', url: '' },
      { name: 'Grupo Unipetro', logoUrl: 'images/parceiros/grupo-unipetro.jpg', url: '' },
      { name: 'Cidade de São Paulo – Educação', logoUrl: 'images/parceiros/prefeitura-sp-educacao.png', url: '' },
      { name: 'Microsoft', logoUrl: 'images/parceiros/microsoft.png', url: '' },
      { name: 'Instituto Company', logoUrl: 'images/parceiros/instituto-company.jpg', url: '' },
      { name: 'Grupo Toriba', logoUrl: 'images/parceiros/grupo-toriba.jpg', url: '' },
      { name: 'Elite', logoUrl: 'images/parceiros/elite.jpg', url: '' },
      { name: 'Projeto Novo Ser', logoUrl: 'images/parceiros/projeto-novo-ser.png', url: '' },
      { name: 'Imagine Centro Musical', logoUrl: 'images/parceiros/imagine-centro-musical.jpg', url: '' },
    ],
  },
  social: {
    facebook: 'https://www.facebook.com/asseteducar',
    instagram: 'https://www.instagram.com/asset.educar',
    youtube: 'https://www.youtube.com/watch?v=bXqsEjesKvs',
    whatsapp: '',
  },
  footer: {
    organizationName: 'ASSET – Associação Educar Para Transformar',
    links: [
      { label: 'Destaques', href: '#destaques' },
      { label: 'Notícias', href: '#noticias' },
      { label: 'Sobre nós', href: '#sobre' },
      { label: 'Contato', href: '#contato' },
    ],
  },
};

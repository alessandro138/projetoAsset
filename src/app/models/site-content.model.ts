// Conteúdo da página principal. Tudo aqui será editável pelo administrador (telas administrativas),
// por isso nada deste conteúdo pode ficar fixo nos templates dos componentes.

export interface LinkAction {
  label: string;
  /** Âncora da página principal ('#sobre'), rota interna ('/cadastro') ou URL externa */
  href: string;
}

/** Destaque ou notícia (publicação) */
export interface NewsItem {
  id: string;
  title: string;
  /** 'AAAA-MM-DD' */
  date: string;
  /** Vazio: mostra um quadro com as cores da ASSET */
  imageUrl: string;
  /** Página com a publicação completa (vazio: sem link) */
  link: string;
}

export interface Pillar {
  /** Classe do Bootstrap Icons, ex.: 'bi-bullseye' */
  icon: string;
  title: string;
  text: string;
}

export interface Partner {
  name: string;
  logoUrl: string;
  /** Site do parceiro (opcional) */
  url: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  whatsapp: string;
}

export interface SiteContent {
  hero: {
    badge: string;
    subtitle: string;
    title: string;
    imageUrl: string;
    imageAlt: string;
    primaryAction: LinkAction;
    secondaryAction: LinkAction;
  };
  highlights: {
    title: string;
    items: NewsItem[];
  };
  news: {
    title: string;
    items: NewsItem[];
  };
  about: {
    title: string;
    /** Futuramente virá de um editor visual (WYSIWYG) */
    paragraphs: string[];
    pillars: Pillar[];
    action: LinkAction | null;
  };
  contact: {
    title: string;
    text: string;
    email: string;
    officeName: string;
    address: string;
    phones: string[];
  };
  partners: {
    title: string;
    items: Partner[];
  };
  social: SocialLinks;
  footer: {
    organizationName: string;
    links: LinkAction[];
  };
}

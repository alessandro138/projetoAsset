// Usuários do sistema (área restrita) e seus níveis de acesso.
// Cada nível inclui os poderes dos anteriores. O nível admin só pode ser definido direto no banco.

export type AccessLevel = 'basico' | 'intermediario' | 'avancado' | 'admin';

export const ACCESS_LEVELS: Record<AccessLevel, { label: string; description: string; rank: number }> = {
  basico: { label: 'Básico', description: 'Cadastro de beneficiários', rank: 1 },
  intermediario: { label: 'Intermediário', description: 'Básico + conteúdo do site (template)', rank: 2 },
  avancado: { label: 'Avançado', description: 'Intermediário + adicionar e excluir usuários', rank: 3 },
  admin: { label: 'Admin', description: 'Todos os poderes; definido só no banco de dados', rank: 4 },
};

/** Níveis que podem ser escolhidos pelo sistema (admin, só no banco) */
export const ASSIGNABLE_LEVELS: AccessLevel[] = ['basico', 'intermediario', 'avancado'];

export function levelRank(level: AccessLevel | null | undefined): number {
  return level ? (ACCESS_LEVELS[level]?.rank ?? 0) : 0;
}

export interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  level: AccessLevel | null;
  active: boolean;
}

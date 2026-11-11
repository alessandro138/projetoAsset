import { Injectable, inject, signal } from '@angular/core';

import { AccessLevel, SystemUser } from '../models/user.model';
import { AuthService } from './auth.service';
import { SupabaseService, friendlyDatabaseError } from './supabase.service';

/** Edge Function que cria/exclui usuários com a chave secreta (supabase/functions/admin-usuarios) */
const ADMIN_FUNCTION = 'admin-usuarios';

export interface NewUser {
  fullName: string;
  email: string;
  level: AccessLevel;
  /** Senha provisória: a pessoa troca no primeiro acesso */
  password: string;
}

/**
 * Usuários da área restrita (tabela perfis_usuarios).
 * Nome próprio: qualquer usuário. Lista, nível, situação, criar e excluir: nível avançado (RLS + Edge Function).
 */
@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  private readonly usersList = signal<SystemUser[]>([]);
  readonly users = this.usersList.asReadonly();
  readonly loading = signal(false);
  readonly loadError = signal('');

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    const { data, error } = await this.supabase
      .from('perfis_usuarios')
      .select('id, nome_completo, email, perfil, ativo')
      .order('nome_completo');
    this.loading.set(false);
    if (error || !data) {
      this.loadError.set('Não foi possível carregar os usuários. Verifique a conexão e tente novamente.');
      return;
    }
    this.usersList.set(
      data.map(row => ({
        id: row.id,
        fullName: row.nome_completo,
        email: row.email ?? '',
        level: row.perfil,
        active: row.ativo,
      })),
    );
  }

  /** Atualiza o nome do usuário logado */
  async updateOwnName(fullName: string): Promise<void> {
    const id = this.auth.profile()?.id;
    if (!id) {
      throw new Error('Sessão expirada. Entre novamente.');
    }
    const { error } = await this.supabase.from('perfis_usuarios').update({ nome_completo: fullName.trim() }).eq('id', id);
    if (error) {
      throw new Error(friendlyUserError(error));
    }
    await this.auth.reloadProfile();
  }

  /** Muda nível e/ou situação de outro usuário (nível avançado) */
  async updateUser(id: string, changes: { level?: AccessLevel; active?: boolean }): Promise<void> {
    const update: Record<string, unknown> = {};
    if (changes.level !== undefined) update['perfil'] = changes.level;
    if (changes.active !== undefined) update['ativo'] = changes.active;
    const { error } = await this.supabase.from('perfis_usuarios').update(update).eq('id', id);
    if (error) {
      throw new Error(friendlyUserError(error));
    }
    this.usersList.update(list =>
      list.map(u => (u.id === id ? { ...u, ...changes } : u)),
    );
  }

  async createUser(user: NewUser): Promise<void> {
    await this.callAdminFunction({
      acao: 'criar',
      nome: user.fullName.trim(),
      email: user.email.trim(),
      nivel: user.level,
      senha: user.password,
    });
    await this.load();
  }

  async deleteUser(id: string): Promise<void> {
    await this.callAdminFunction({ acao: 'excluir', id });
    this.usersList.update(list => list.filter(u => u.id !== id));
  }

  private async callAdminFunction(body: Record<string, unknown>): Promise<void> {
    const { error } = await this.supabase.functions.invoke(ADMIN_FUNCTION, { body });
    if (!error) {
      return;
    }
    // Erros da função vêm como { erro: '...' } no corpo da resposta
    const response = (error as { context?: Response }).context;
    if (response instanceof Response) {
      if (response.status === 404) {
        throw new Error('A função "admin-usuarios" ainda não foi publicada no Supabase.');
      }
      let message: string | undefined;
      try {
        message = (await response.json())?.erro;
      } catch {
        // Resposta sem JSON: usa a mensagem genérica abaixo
      }
      if (message) {
        throw new Error(message);
      }
    }
    throw new Error('Não foi possível concluir. Verifique a conexão e tente novamente.');
  }
}

function friendlyUserError(error: { code?: string; message?: string }): string {
  // Regras do gatilho privado.proteger_perfis (mensagens já em português)
  if (error.code === 'P0001' && error.message) {
    return error.message;
  }
  return friendlyDatabaseError(error);
}

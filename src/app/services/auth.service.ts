import { Injectable, computed, inject, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';

import { AccessLevel, levelRank } from '../models/user.model';
import { SupabaseService } from './supabase.service';

/** Chave em user_metadata que indica que a senha provisória já foi trocada */
const PASSWORD_CHANGED_FLAG = 'senha_alterada';

export interface UserProfile {
  id: string;
  fullName: string;
  level: AccessLevel | null;
  active: boolean;
}

/** Login da área restrita (Supabase Auth) e perfil do usuário (tabela perfis_usuarios) */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;

  readonly session = signal<Session | null>(null);
  readonly profile = signal<UserProfile | null>(null);
  readonly email = computed(() => this.session()?.user.email ?? '');
  readonly isLoggedIn = computed(() => !!this.session());
  /**
   * Primeiro acesso: usuários criados no painel do Supabase recebem uma senha provisória
   * e precisam trocá-la. A marcação fica nos dados do próprio usuário no Supabase Auth.
   */
  readonly mustChangePassword = computed(() => {
    const user = this.session()?.user;
    return !!user && user.user_metadata?.[PASSWORD_CHANGED_FLAG] !== true;
  });

  private readonly initialized: Promise<void>;

  constructor() {
    this.initialized = this.restoreSession();
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.session.set(session);
      if (!session) {
        this.profile.set(null);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Não chamar o Supabase dentro do callback (pode travar o cliente): agenda para depois
        setTimeout(() => this.loadProfile());
      }
    });
  }

  /** Resolve quando a sessão salva no navegador já foi verificada */
  ready(): Promise<void> {
    return this.initialized;
  }

  /** Usuário ativo com pelo menos o nível informado (cada nível inclui os anteriores) */
  hasLevel(minimum: AccessLevel): boolean {
    const profile = this.profile();
    return !!profile?.active && levelRank(profile.level) >= levelRank(minimum);
  }

  /** Recarrega o perfil (ex.: depois de o usuário alterar o próprio nome) */
  reloadProfile(): Promise<void> {
    return this.loadProfile();
  }

  /** Devolve uma mensagem de erro em português, ou null se deu certo */
  async signIn(email: string, password: string): Promise<string | null> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      return error.code === 'invalid_credentials'
        ? 'E-mail ou senha incorretos.'
        : 'Não foi possível entrar. Verifique a conexão e tente novamente.';
    }
    this.session.set(data.session);
    await this.loadProfile();
    return null;
  }

  /** Troca a senha do usuário logado. Devolve uma mensagem de erro em português, ou null se deu certo */
  async changePassword(newPassword: string): Promise<string | null> {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword,
      data: { [PASSWORD_CHANGED_FLAG]: true },
    });
    if (error) {
      switch (error.code) {
        case 'same_password':
          return 'A nova senha precisa ser diferente da senha atual.';
        case 'weak_password':
          return 'Senha fraca. Siga as regras indicadas ou use a sugestão de senha segura.';
        case 'reauthentication_needed':
          return 'Por segurança, saia e entre de novo antes de trocar a senha.';
        default:
          return 'Não foi possível trocar a senha. Verifique a conexão e tente novamente.';
      }
    }
    this.session.update(session => (session && data.user ? { ...session, user: data.user } : session));
    return null;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.session.set(null);
    this.profile.set(null);
  }

  private async restoreSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.session.set(data.session);
    if (data.session) {
      await this.loadProfile();
    }
  }

  private async loadProfile(): Promise<void> {
    const userId = this.session()?.user.id;
    if (!userId) {
      this.profile.set(null);
      return;
    }
    const { data } = await this.supabase
      .from('perfis_usuarios')
      .select('id, nome_completo, perfil, ativo')
      .eq('id', userId)
      .maybeSingle();
    this.profile.set(
      data ? { id: data.id, fullName: data.nome_completo, level: data.perfil, active: data.ativo } : null,
    );
  }
}

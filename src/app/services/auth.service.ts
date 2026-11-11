import { Injectable, computed, inject, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

export type UserRole = 'admin' | 'secretaria' | 'editor';

export interface UserProfile {
  id: string;
  fullName: string;
  role: UserRole | null;
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

  hasRole(...roles: UserRole[]): boolean {
    const profile = this.profile();
    return !!profile?.active && !!profile.role && roles.includes(profile.role);
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
      data ? { id: data.id, fullName: data.nome_completo, role: data.perfil, active: data.ativo } : null,
    );
  }
}

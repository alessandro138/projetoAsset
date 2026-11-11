import { Injectable, inject, signal } from '@angular/core';

import { SiteContent } from '../models/site-content.model';
import { DEFAULT_SITE_CONTENT } from './default-site-content';
import { SupabaseService, friendlyDatabaseError } from './supabase.service';

/**
 * Conteúdo da página principal (tabela conteudo_site, leitura pública).
 * Enquanto o banco estiver vazio, usa o conteúdo padrão extraído do site antigo.
 */
@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly content = signal<SiteContent>(structuredClone(DEFAULT_SITE_CONTENT));

  readonly current = this.content.asReadonly();

  async load(): Promise<void> {
    const { data, error } = await this.supabase.from('conteudo_site').select('conteudo').eq('id', 1).maybeSingle();
    if (error || !data?.conteudo || !Object.keys(data.conteudo).length) {
      return;
    }
    // Seções que ainda não foram salvas no banco continuam com o conteúdo padrão
    this.content.set({ ...structuredClone(DEFAULT_SITE_CONTENT), ...(data.conteudo as Partial<SiteContent>) });
  }

  /** Para as futuras telas de edição (perfis admin e editor) */
  async update(content: SiteContent): Promise<void> {
    const { error } = await this.supabase.from('conteudo_site').update({ conteudo: content }).eq('id', 1);
    if (error) {
      throw new Error(friendlyDatabaseError(error));
    }
    this.content.set(structuredClone(content));
  }
}

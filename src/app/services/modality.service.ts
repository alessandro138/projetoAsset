import { Injectable, inject, signal } from '@angular/core';

import { Modality } from '../models/person.model';
import { SupabaseService } from './supabase.service';

/** Modalidades cadastradas no banco (tabela modalidades_servicos, leitura pública) */
@Injectable({ providedIn: 'root' })
export class ModalityService {
  private readonly supabase = inject(SupabaseService).client;

  private readonly modalities = signal<Modality[]>([]);
  readonly all = this.modalities.asReadonly();
  readonly loadError = signal('');

  private loaded: Promise<void> | null = null;

  load(): Promise<void> {
    this.loaded ??= this.fetch();
    return this.loaded;
  }

  private async fetch(): Promise<void> {
    this.loadError.set('');
    const { data, error } = await this.supabase
      .from('modalidades_servicos')
      .select('id, nome, ativo')
      .order('ordem')
      .order('nome');
    if (error || !data) {
      this.loaded = null;
      this.loadError.set('Não foi possível carregar as modalidades. Recarregue a página.');
      return;
    }
    this.modalities.set(data.map(row => ({ id: row.id, name: row.nome, active: row.ativo })));
  }
}

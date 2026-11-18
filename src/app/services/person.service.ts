import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, from, map, of } from 'rxjs';

import { Person } from '../models/person.model';
import {
  FichaSaudeRow,
  MatriculaRow,
  PessoaRow,
  fromRows,
  toFichaSaudeInput,
  toMatriculaInput,
  toPessoaInput,
} from './person.mapper';
import { SupabaseService, friendlyDatabaseError } from './supabase.service';

const PHOTO_BUCKET = 'fotos-pessoas';
/** Validade dos links das fotos (o bucket é privado) */
const PHOTO_URL_SECONDS = 60 * 60;

type PessoaComRelacoes = PessoaRow & {
  matriculas: MatriculaRow[] | null;
  // Relação 1:1 (pessoa_id é a chave da ficha): o Supabase devolve objeto, mas aceitamos lista também
  fichas_saude: FichaSaudeRow | FichaSaudeRow[] | null;
};

export type PersonInput = Omit<Person, 'id'> & { id?: string };

/**
 * Pessoas no Supabase (tabelas pessoas, matriculas e fichas_saude; foto no Storage).
 * Mantém uma cópia em memória para as telas; só usuários com perfil admin/secretaria conseguem ler (RLS).
 */
@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly supabase = inject(SupabaseService).client;

  private readonly people = signal<Person[]>([]);
  readonly all = this.people.asReadonly();
  readonly loading = signal(false);
  readonly loadError = signal('');

  private readonly photoPaths = new Map<string, string>();
  private readonly enrollmentIds = new Map<string, string>();
  private loaded: Promise<void> | null = null;

  /** Carrega todas as pessoas (uma vez; `force` recarrega) */
  load(force = false): Promise<void> {
    if (!this.loaded || force) {
      this.loaded = this.fetchAll();
    }
    return this.loaded;
  }

  /** Limpa a cópia em memória (ao sair do sistema) */
  clear(): void {
    this.people.set([]);
    this.photoPaths.clear();
    this.enrollmentIds.clear();
    this.loaded = null;
  }

  getById(id: string): Person | undefined {
    return this.people().find(p => p.id === id);
  }

  isCpfTaken(cpf: string, ignoreId?: string): Observable<boolean> {
    let query = this.supabase.from('pessoas').select('id').eq('cpf', cpf);
    if (ignoreId) {
      query = query.neq('id', ignoreId);
    }
    return from(query).pipe(
      map(({ data }) => !!data?.length),
      // Na dúvida, deixa o banco recusar o CPF repetido ao salvar
      catchError(() => of(false)),
    );
  }

  /** Salva pessoa, foto, matrícula e ficha de saúde. Em caso de erro, lança Error com mensagem em português */
  async save(person: PersonInput): Promise<Person> {
    const input = toPessoaInput(person);
    const { data: row, error } = person.id
      ? await this.supabase.from('pessoas').update(input).eq('id', person.id).select().single<PessoaRow>()
      : await this.supabase.from('pessoas').insert(input).select().single<PessoaRow>();
    if (error || !row) {
      throw new Error(friendlyDatabaseError(error));
    }

    await this.savePhoto(row.id, person.photo, this.photoPaths.get(row.id) ?? row.foto_caminho);

    if (person.enrollment) {
      const enrollment = toMatriculaInput(person.enrollment);
      const enrollmentId = this.enrollmentIds.get(row.id);
      const { error: enrollmentError } = enrollmentId
        ? await this.supabase.from('matriculas').update(enrollment).eq('id', enrollmentId)
        : await this.supabase.from('matriculas').insert({ pessoa_id: row.id, ...enrollment });
      if (enrollmentError) {
        throw new Error(friendlyDatabaseError(enrollmentError));
      }
    }

    if (person.health) {
      const { error: healthError } = await this.supabase
        .from('fichas_saude')
        .upsert({ pessoa_id: row.id, ...toFichaSaudeInput(person.health) }, { onConflict: 'pessoa_id' });
      if (healthError) {
        throw new Error(friendlyDatabaseError(healthError));
      }
    }

    await this.load(true);
    return this.getById(row.id)!;
  }

  /**
   * Desativa o cadastro. O banco grava a hora do servidor e quem desativou (o valor enviado
   * só sinaliza a desativação). Em caso de erro, lança Error com mensagem em português
   */
  async deactivate(id: string): Promise<void> {
    const { data: row, error } = await this.supabase
      .from('pessoas')
      .update({ desativado_em: new Date().toISOString() })
      .eq('id', id)
      .select('desativado_em')
      .single<Pick<PessoaRow, 'desativado_em'>>();
    if (error || !row) {
      throw new Error(friendlyDatabaseError(error));
    }
    this.people.update(list => list.map(p => (p.id === id ? { ...p, deactivatedAt: row.desativado_em } : p)));
  }

  /** Reativa um cadastro desativado. Em caso de erro, lança Error com mensagem em português */
  async reactivate(id: string): Promise<void> {
    const { error } = await this.supabase.from('pessoas').update({ desativado_em: null }).eq('id', id);
    if (error) {
      throw new Error(friendlyDatabaseError(error));
    }
    this.people.update(list => list.map(p => (p.id === id ? { ...p, deactivatedAt: null } : p)));
  }

  private async fetchAll(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const { data, error } = await this.supabase
        .from('pessoas')
        .select('*, matriculas(*, modalidades_servicos(nome)), fichas_saude(*)')
        .order('nome_completo')
        .returns<PessoaComRelacoes[]>();
      if (error || !data) {
        this.loaded = null;
        this.loadError.set(
          error?.code === '42501'
            ? 'Você não tem permissão para ver o cadastro de pessoas.'
            : 'Não foi possível carregar o cadastro. Verifique a conexão e tente novamente.',
        );
        return;
      }

      const photoUrls = await this.signPhotoUrls(data.map(row => row.foto_caminho).filter((p): p is string => !!p));
      this.photoPaths.clear();
      this.enrollmentIds.clear();
      this.people.set(
        data.map(row => {
          const enrollment = latestEnrollment(row.matriculas);
          const health = Array.isArray(row.fichas_saude) ? (row.fichas_saude[0] ?? null) : row.fichas_saude;
          if (row.foto_caminho) {
            this.photoPaths.set(row.id, row.foto_caminho);
          }
          if (enrollment) {
            this.enrollmentIds.set(row.id, enrollment.id);
          }
          return fromRows(row, enrollment, health, row.foto_caminho ? (photoUrls.get(row.foto_caminho) ?? '') : '');
        }),
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async signPhotoUrls(paths: string[]): Promise<Map<string, string>> {
    const urls = new Map<string, string>();
    if (!paths.length) {
      return urls;
    }
    const { data } = await this.supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, PHOTO_URL_SECONDS);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) {
        urls.set(item.path, item.signedUrl);
      }
    }
    return urls;
  }

  /**
   * `photo` vem do formulário: data URL = foto nova; vazio = foto removida; link = foto atual mantida.
   */
  private async savePhoto(personId: string, photo: string, currentPath: string | null): Promise<void> {
    const isNewPhoto = photo.startsWith('data:');
    if (!isNewPhoto && (photo || !currentPath)) {
      return;
    }

    let newPath: string | null = null;
    if (isNewPhoto) {
      const blob = await (await fetch(photo)).blob();
      const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      newPath = `${personId}/${Date.now()}.${extension}`;
      const { error } = await this.supabase.storage
        .from(PHOTO_BUCKET)
        .upload(newPath, blob, { contentType: blob.type, upsert: false });
      if (error) {
        throw new Error('Os dados foram salvos, mas não foi possível enviar a foto (use JPG, PNG ou WebP de até 2 MB).');
      }
    }

    const { error } = await this.supabase.from('pessoas').update({ foto_caminho: newPath }).eq('id', personId);
    if (error) {
      throw new Error(friendlyDatabaseError(error));
    }
    if (currentPath) {
      await this.supabase.storage.from(PHOTO_BUCKET).remove([currentPath]);
    }
  }
}

function latestEnrollment(enrollments: MatriculaRow[] | null): MatriculaRow | null {
  if (!enrollments?.length) {
    return null;
  }
  return [...enrollments].sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))[0];
}

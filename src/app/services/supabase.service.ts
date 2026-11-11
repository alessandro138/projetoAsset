import { Injectable } from '@angular/core';
import { SupabaseClient, createClient, processLock } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

/** Cliente único do Supabase (banco, login e arquivos) */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(environment.supabaseUrl, environment.supabasePublishableKey, {
    // A trava padrão (navigator.locks) conflita com o zone.js do Angular
    auth: { lock: processLock },
  });
}

interface DatabaseError {
  code?: string;
  message?: string;
}

/** Mensagem em português para erros do banco */
export function friendlyDatabaseError(error: DatabaseError | null | undefined): string {
  switch (error?.code) {
    case '23505':
      return 'Já existe uma pessoa cadastrada com este CPF.';
    case '23503':
      return 'Este registro está vinculado a outro (por exemplo, um responsável com beneficiários) e não pode ser removido.';
    case '23514':
      return 'Algum campo tem um valor inválido. Confira os dados digitados.';
    case '42501':
      return 'Você não tem permissão para esta operação.';
    case 'P0001':
      // Mensagens das validações do banco (já em português)
      return error.message ?? 'Dados inválidos.';
    default:
      return 'Não foi possível salvar. Verifique a conexão e tente novamente.';
  }
}

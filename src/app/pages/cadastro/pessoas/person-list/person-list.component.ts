import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PERSON_TYPE_LABELS } from '../../../../models/person.model';
import { PersonService } from '../../../../services/person.service';
import { maskedMainDocument } from '../../../../shared/utils/document';
import { ageOn, formatTimestampDate } from '../../../../shared/utils/date';
import { normalizeForSearch } from '../../../../shared/utils/text';

interface PersonRow {
  id: string;
  fullName: string;
  document: ReturnType<typeof maskedMainDocument>;
  age: number | null;
  types: string;
  guardian: string;
  isBeneficiary: boolean;
  createdAt: string;
  deactivatedAt: string;
  /** Beneficiários com cadastro ativo de quem esta pessoa é o tutor legal */
  activeWards: string[];
  /** Texto normalizado para a busca (nome, tutor e tipo) */
  searchText: string;
  /** CPF e RG só com dígitos, para buscar pelo número */
  documentDigits: string;
}

type StatusAction = 'deactivate' | 'reactivate';

/** Busca pelo número do documento a partir de quantos dígitos digitados */
const MIN_DOCUMENT_DIGITS = 3;

@Component({
  selector: 'app-person-list',
  imports: [RouterLink],
  templateUrl: './person-list.component.html',
})
export class PersonListComponent {
  private readonly personService = inject(PersonService);

  readonly loading = this.personService.loading;
  readonly loadError = this.personService.loadError;

  /** Busca feita só nos dados já carregados na tela (não consulta o banco) */
  readonly search = signal('');

  /** Cadastros desativados ficam ocultos, a menos que o usuário peça para vê-los */
  readonly showDeactivated = signal(false);

  /** Cadastro cuja desativação/reativação está sendo confirmada (janela aberta) */
  readonly confirming = signal<{ row: PersonRow; action: StatusAction } | null>(null);
  readonly saving = signal(false);
  readonly actionError = signal('');
  readonly message = signal('');

  private readonly allRows = computed<PersonRow[]>(() => {
    const people = this.personService.all();
    return [...people]
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'))
      .map(p => {
        const guardian = p.guardianId ? this.personService.getById(p.guardianId)?.fullName ?? '' : '';
        const types = p.types.map(t => PERSON_TYPE_LABELS[t]).join(', ');
        return {
          id: p.id,
          fullName: p.fullName,
          // CPF mascarado (LGPD); sem CPF, o RG mascarado
          document: maskedMainDocument(p),
          age: ageOn(p.birthDate),
          types,
          guardian,
          isBeneficiary: p.types.includes('beneficiario'),
          createdAt: formatTimestampDate(p.createdAt),
          deactivatedAt: formatTimestampDate(p.deactivatedAt),
          activeWards: people.filter(w => w.guardianId === p.id && !w.deactivatedAt).map(w => w.fullName),
          searchText: normalizeForSearch(`${p.fullName} ${guardian} ${types}`),
          documentDigits: `${p.cpf} ${p.rg.replace(/\D/g, '')}`,
        };
      });
  });

  private readonly matchingRows = computed(() => {
    const term = normalizeForSearch(this.search());
    if (!term) {
      return this.allRows();
    }
    const digits = term.replace(/\D/g, '');
    const words = term.split(/\s+/);
    return this.allRows().filter(
      r =>
        words.every(w => r.searchText.includes(w)) ||
        (digits.length >= MIN_DOCUMENT_DIGITS && r.documentDigits.includes(digits)),
    );
  });

  readonly deactivatedCount = computed(() => this.allRows().filter(r => r.deactivatedAt).length);

  readonly rows = computed(() =>
    this.showDeactivated() ? this.matchingRows() : this.matchingRows().filter(r => !r.deactivatedAt),
  );

  /** Desativados que atendem à busca mas estão ocultos (para avisar o usuário) */
  readonly hiddenMatches = computed(() =>
    this.search().trim() && !this.showDeactivated() ? this.matchingRows().filter(r => r.deactivatedAt).length : 0,
  );

  readonly totalShown = computed(() =>
    this.showDeactivated() ? this.allRows().length : this.allRows().length - this.deactivatedCount(),
  );

  constructor() {
    this.personService.load();
  }

  reload(): void {
    this.personService.load(true);
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  ask(row: PersonRow, action: StatusAction): void {
    this.message.set('');
    this.actionError.set('');
    this.confirming.set({ row, action });
  }

  @HostListener('document:keydown.escape')
  cancel(): void {
    if (!this.saving()) {
      this.confirming.set(null);
    }
  }

  async confirm(): Promise<void> {
    const pending = this.confirming();
    if (!pending || this.saving()) {
      return;
    }
    const { row, action } = pending;
    this.saving.set(true);
    this.actionError.set('');
    try {
      if (action === 'deactivate') {
        await this.personService.deactivate(row.id);
        this.message.set(`O cadastro de ${row.fullName} foi desativado.`);
      } else {
        await this.personService.reactivate(row.id);
        this.message.set(`O cadastro de ${row.fullName} foi reativado.`);
      }
      this.confirming.set(null);
    } catch (e) {
      this.actionError.set(
        e instanceof Error
          ? e.message
          : `Não foi possível ${action === 'deactivate' ? 'desativar' : 'reativar'} o cadastro.`,
      );
    } finally {
      this.saving.set(false);
    }
  }
}

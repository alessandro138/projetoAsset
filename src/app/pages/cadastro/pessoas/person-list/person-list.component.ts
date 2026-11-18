import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PERSON_TYPE_LABELS } from '../../../../models/person.model';
import { PersonService } from '../../../../services/person.service';
import { maskedMainDocument } from '../../../../shared/utils/document';
import { ageOn, formatTimestampDate } from '../../../../shared/utils/date';

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
}

@Component({
  selector: 'app-person-list',
  imports: [RouterLink],
  templateUrl: './person-list.component.html',
})
export class PersonListComponent {
  private readonly personService = inject(PersonService);

  readonly loading = this.personService.loading;
  readonly loadError = this.personService.loadError;

  /** Cadastros desativados ficam ocultos, a menos que o usuário peça para vê-los */
  readonly showDeactivated = signal(false);

  /** Pessoa cuja desativação está sendo confirmada (janela aberta) */
  readonly confirming = signal<PersonRow | null>(null);
  readonly deactivating = signal(false);
  readonly deactivateError = signal('');
  readonly message = signal('');

  private readonly allRows = computed<PersonRow[]>(() => {
    const people = this.personService.all();
    return [...people]
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'))
      .map(p => ({
        id: p.id,
        fullName: p.fullName,
        // CPF mascarado (LGPD); sem CPF, o RG mascarado
        document: maskedMainDocument(p),
        age: ageOn(p.birthDate),
        types: p.types.map(t => PERSON_TYPE_LABELS[t]).join(', '),
        guardian: p.guardianId ? this.personService.getById(p.guardianId)?.fullName ?? '' : '',
        isBeneficiary: p.types.includes('beneficiario'),
        createdAt: formatTimestampDate(p.createdAt),
        deactivatedAt: formatTimestampDate(p.deactivatedAt),
        activeWards: people.filter(w => w.guardianId === p.id && !w.deactivatedAt).map(w => w.fullName),
      }));
  });

  readonly deactivatedCount = computed(() => this.allRows().filter(r => r.deactivatedAt).length);

  readonly rows = computed(() =>
    this.showDeactivated() ? this.allRows() : this.allRows().filter(r => !r.deactivatedAt),
  );

  constructor() {
    this.personService.load();
  }

  reload(): void {
    this.personService.load(true);
  }

  askDeactivate(row: PersonRow): void {
    this.message.set('');
    this.deactivateError.set('');
    this.confirming.set(row);
  }

  @HostListener('document:keydown.escape')
  cancelDeactivate(): void {
    if (!this.deactivating()) {
      this.confirming.set(null);
    }
  }

  async confirmDeactivate(): Promise<void> {
    const row = this.confirming();
    if (!row || this.deactivating()) {
      return;
    }
    this.deactivating.set(true);
    this.deactivateError.set('');
    try {
      await this.personService.deactivate(row.id);
      this.confirming.set(null);
      this.message.set(`O cadastro de ${row.fullName} foi desativado.`);
    } catch (e) {
      this.deactivateError.set(e instanceof Error ? e.message : 'Não foi possível desativar o cadastro.');
    } finally {
      this.deactivating.set(false);
    }
  }
}

import { ChangeDetectorRef, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { commitmentTermFor } from '../../../../models/commitment-terms';
import { PersonService } from '../../../../services/person.service';
import { CommitmentTermComponent } from '../../../../shared/components/commitment-term/commitment-term.component';
import { EnrollmentSheetComponent } from '../../../../shared/components/enrollment-sheet/enrollment-sheet.component';

/** O que vai para a impressora: a ficha de matrícula ou o termo de compromisso */
type PrintTarget = 'sheet' | 'term';

/**
 * Pré-visualização e impressão da ficha de matrícula de um beneficiário já cadastrado.
 * Para Jiu-jítsu e Kickboxing, também mostra e imprime o termo de compromisso da modalidade.
 */
@Component({
  selector: 'app-enrollment-sheet-page',
  imports: [RouterLink, EnrollmentSheetComponent, CommitmentTermComponent],
  template: `
    @if (person(); as p) {
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 d-print-none">
        <h1 class="fw-bolder mb-0"><span class="text-gradient d-inline">Ficha de matrícula</span></h1>
        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-secondary fw-bolder" (click)="print('sheet')">
            <i class="bi bi-printer me-2"></i>Imprimir ficha de matrícula
          </button>
          @if (term(); as t) {
            <button type="button" class="btn btn-primary fw-bolder" (click)="print('term')"
                    [title]="'Termo de compromisso de ' + t.modality">
              <i class="bi bi-file-earmark-text me-2"></i>Imprimir termo
            </button>
          }
          <a [routerLink]="['/cadastro/pessoas', p.id]" class="btn btn-outline-primary"><i class="bi bi-pencil me-1"></i>Editar</a>
          <a routerLink="/cadastro/pessoas" class="btn btn-outline-dark">Voltar</a>
        </div>
      </div>
      <div class="sheet-preview" [class.d-print-none]="printTarget() !== 'sheet'">
        <app-enrollment-sheet [person]="p" [guardian]="guardian()" />
      </div>
      @if (term(); as t) {
        <h2 class="h4 fw-bolder mt-5 mb-3 d-print-none">
          <span class="text-gradient d-inline">Termo de compromisso – {{ t.modality }}</span>
        </h2>
        <div class="sheet-preview" [class.d-print-none]="printTarget() !== 'term'">
          <app-commitment-term [term]="t" [studentName]="p.fullName" />
        </div>
      }
    } @else if (loading()) {
      <div class="text-center text-muted py-5"><span class="spinner-border spinner-border-sm me-2"></span>Carregando...</div>
    } @else {
      <div class="alert alert-warning">Pessoa não encontrada.</div>
      <a routerLink="/cadastro/pessoas" class="btn btn-outline-dark">Voltar</a>
    }
  `,
  styles: `
    .sheet-preview { padding: 1.5rem 0; overflow-x: auto; background: var(--bs-gray-200); border-radius: 1rem; }
    @media print { .sheet-preview { padding: 0; background: none; } }
  `,
})
export class EnrollmentSheetPageComponent {
  /** Vem da rota /cadastro/pessoas/:id/ficha */
  readonly id = input.required<string>();

  private readonly personService = inject(PersonService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly person = computed(() => this.personService.getById(this.id()));
  readonly guardian = computed(() => {
    const guardianId = this.person()?.guardianId;
    return guardianId ? (this.personService.getById(guardianId) ?? null) : null;
  });
  /** Termo de compromisso da modalidade da matrícula (Jiu-jítsu ou Kickboxing) */
  readonly term = computed(() => commitmentTermFor(this.person()?.enrollment?.modality));

  readonly printTarget = signal<PrintTarget>('sheet');
  readonly loading = this.personService.loading;

  constructor() {
    this.personService.load();
  }

  print(target: PrintTarget): void {
    this.printTarget.set(target);
    // Aplica o d-print-none antes de abrir a impressão
    this.changeDetector.detectChanges();
    window.print();
  }
}

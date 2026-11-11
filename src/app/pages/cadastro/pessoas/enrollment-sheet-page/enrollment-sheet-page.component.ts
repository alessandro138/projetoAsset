import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PersonService } from '../../../../services/person.service';
import { EnrollmentSheetComponent } from '../../../../shared/components/enrollment-sheet/enrollment-sheet.component';

/** Pré-visualização e impressão da ficha de matrícula de um beneficiário já cadastrado */
@Component({
  selector: 'app-enrollment-sheet-page',
  imports: [RouterLink, EnrollmentSheetComponent],
  template: `
    @if (person(); as p) {
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 d-print-none">
        <h1 class="fw-bolder mb-0"><span class="text-gradient d-inline">Ficha de matrícula</span></h1>
        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-secondary fw-bolder" (click)="print()">
            <i class="bi bi-printer me-2"></i>Imprimir ficha de matrícula
          </button>
          <a [routerLink]="['/cadastro/pessoas', p.id]" class="btn btn-outline-primary"><i class="bi bi-pencil me-1"></i>Editar</a>
          <a routerLink="/cadastro/pessoas" class="btn btn-outline-dark">Voltar</a>
        </div>
      </div>
      <div class="sheet-preview">
        <app-enrollment-sheet [person]="p" [guardian]="guardian()" />
      </div>
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

  readonly person = computed(() => this.personService.getById(this.id()));
  readonly guardian = computed(() => {
    const guardianId = this.person()?.guardianId;
    return guardianId ? (this.personService.getById(guardianId) ?? null) : null;
  });

  print(): void {
    window.print();
  }
}

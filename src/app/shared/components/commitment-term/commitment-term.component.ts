import { Component, computed, input } from '@angular/core';

import { CommitmentTerm, longDatePtBr } from '../../../models/commitment-terms';
import { ORGANIZATION } from '../../../models/organization';

/**
 * Termo de compromisso (Jiu-jítsu/Kickboxing) em uma folha A4, no layout do termo em papel.
 * O nome do aluno e a data de hoje entram no lugar dos espaços em branco.
 */
@Component({
  selector: 'app-commitment-term',
  template: `
    <article class="sheet-page term-page">
      <header class="sheet-header">
        <img [src]="org.logoUrl" alt="Logo da ASSET" />
        <div class="org">
          <div class="org-short">{{ org.shortName }}</div>
          <div class="org-line">{{ org.name }}</div>
          <div class="org-line">{{ org.unit }}</div>
          <div class="org-cnpj">CNPJ: {{ org.cnpj }}</div>
        </div>
      </header>
      <div class="sheet-rule sheet-rule-blue"></div>
      <div class="sheet-rule sheet-rule-pink"></div>

      @if (term().title; as title) {
        <h1 class="term-title">{{ title }}</h1>
      }

      <p class="sheet-paragraph-plain term-text">
        Eu, <strong class="student-name">{{ studentName() }}</strong>, {{ term().opening }}
      </p>
      @for (paragraph of term().paragraphs; track $index) {
        <p class="sheet-paragraph-plain term-text">{{ paragraph }}</p>
      }

      <p class="sheet-paragraph-plain term-text term-date">São Paulo, {{ dateText() }}.</p>

      <div class="term-signature">
        <p class="sheet-paragraph-plain">Assinatura do aluno (a)</p>
        <div class="signature-line"></div>
      </div>
      <div class="term-signature">
        <p class="sheet-paragraph-plain">Assinatura do responsável pelo aluno (a)</p>
        <div class="signature-line"></div>
      </div>

      <footer class="term-footer">
        @for (line of org.termFooter; track line) {
          <div>{{ line }}</div>
        }
      </footer>
    </article>
  `,
  styleUrls: ['../enrollment-sheet/enrollment-sheet.component.scss', './commitment-term.component.scss'],
})
export class CommitmentTermComponent {
  readonly term = input.required<CommitmentTerm>();
  readonly studentName = input.required<string>();
  /** Data impressa em "São Paulo, <dia> de <mês> de <ano>." (padrão: hoje) */
  readonly date = input<Date>(new Date());

  readonly org = ORGANIZATION;
  readonly dateText = computed(() => longDatePtBr(this.date()));
}

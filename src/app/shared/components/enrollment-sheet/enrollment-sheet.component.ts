import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { IMAGE_AUTHORIZATION_TEXT, LGPD_AUTHORIZATION_TEXT, ORGANIZATION } from '../../../models/organization';
import {
  BIRTH_TYPE_LABELS,
  HEALTH_QUESTIONS,
  HealthAnswer,
  LIVES_WITH_LABELS,
  Person,
  VACCINATION_LABELS,
  emptyHealthRecord,
} from '../../../models/person.model';
import { formatAddress } from '../../utils/address';
import { formatIsoDate, isMinor } from '../../utils/date';
import { formatMask } from '../../utils/mask';

/** Dados de uma pessoa, salva ou ainda em edição no formulário */
export type PersonDraft = Omit<Person, 'id'>;

/**
 * Ficha de matrícula da ASSET (3 páginas: matrícula, saúde e autorizações), no mesmo layout da ficha em papel.
 * Pensada para impressão em A4; na tela aparece como folhas.
 */
@Component({
  selector: 'app-enrollment-sheet',
  imports: [NgTemplateOutlet],
  templateUrl: './enrollment-sheet.component.html',
  styleUrl: './enrollment-sheet.component.scss',
})
export class EnrollmentSheetComponent {
  readonly person = input.required<PersonDraft>();
  /** Tutor legal cadastrado (dados dos responsáveis) */
  readonly guardian = input<Person | null>(null);

  readonly org = ORGANIZATION;
  readonly imageAuthorizationText = IMAGE_AUTHORIZATION_TEXT;
  readonly lgpdAuthorizationText = LGPD_AUTHORIZATION_TEXT;
  readonly vaccinationOptions = Object.entries(VACCINATION_LABELS);
  readonly livesWithOptions = Object.entries(LIVES_WITH_LABELS);
  readonly birthTypeOptions = Object.entries(BIRTH_TYPE_LABELS);

  readonly health = computed(() => this.person().health ?? emptyHealthRecord());

  readonly student = computed(() => {
    const p = this.person();
    return {
      birthDate: formatIsoDate(p.birthDate),
      cpf: p.cpf ? formatMask(p.cpf, 'cpf') : '',
      birthPlace: [p.birthState, p.birthCity].filter(Boolean).join(' / '),
      susCard: p.susCard ? formatMask(p.susCard, 'sus') : '',
      address: formatAddress(p.address),
      phone: p.phone ? formatMask(p.phone, 'phone') : '',
    };
  });

  /** Os dados do responsável só são preenchidos para menores de idade, como indica a ficha */
  readonly responsible = computed(() => {
    const guardian = this.guardian();
    if (!guardian || !isMinor(this.person().birthDate)) {
      return null;
    }
    return {
      name: guardian.fullName,
      cpf: formatMask(guardian.cpf, 'cpf'),
      relationship: this.person().guardianRelationship,
      address: formatAddress(guardian.address),
      phone: guardian.phone ? formatMask(guardian.phone, 'phone') : '',
    };
  });

  readonly healthQuestions = computed(() => {
    const answers = this.health().answers;
    return HEALTH_QUESTIONS.map(q => ({ label: q.label, answer: this.formatAnswer(answers[q.key]) }));
  });

  readonly insurance = computed(() => {
    const health = this.health();
    if (health.hasHealthInsurance === null) {
      return '';
    }
    return health.hasHealthInsurance ? ['Sim', health.healthInsuranceName].filter(Boolean).join(' – ') : 'Não';
  });

  formatDate(value: string | undefined): string {
    return formatIsoDate(value);
  }

  /** Marca "(X)" das opções da ficha em papel */
  mark(checked: boolean): string {
    return checked ? 'X' : '  ';
  }

  private formatAnswer(answer: HealthAnswer | undefined): string {
    if (!answer || answer.answer === null) {
      return '';
    }
    return answer.answer ? ['Sim', answer.details.trim()].filter(Boolean).join(' – ') : 'Não';
  }
}

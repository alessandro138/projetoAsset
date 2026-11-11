import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  BIRTH_TYPE_LABELS,
  BirthType,
  GUARDIAN_RELATIONSHIPS,
  HEALTH_QUESTIONS,
  HealthAnswer,
  HealthQuestionKey,
  LIVES_WITH_LABELS,
  LivesWith,
  PERSON_TYPE_LABELS,
  Person,
  PersonType,
  VACCINATION_LABELS,
  VaccinationStatus,
  emptyHealthRecord,
} from '../../../../models/person.model';
import { PersonService } from '../../../../services/person.service';
import {
  EnrollmentSheetComponent,
  PersonDraft,
} from '../../../../shared/components/enrollment-sheet/enrollment-sheet.component';
import { MaskDirective } from '../../../../shared/directives/mask.directive';
import { isMinor } from '../../../../shared/utils/date';
import { formatMask, onlyDigits } from '../../../../shared/utils/mask';
import { beneficiaryValidator } from '../../../../shared/validators/beneficiary.validator';
import { cpfUniqueValidator, cpfValidator } from '../../../../shared/validators/cpf.validator';
import { atLeastOneCheckedValidator, pastDateValidator } from '../../../../shared/validators/form.validators';
import { guardianValidator } from '../../../../shared/validators/guardian.validator';

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// Mesmos limites do bucket "fotos-pessoas" no Supabase
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type HealthAnswerGroup = FormGroup<{ answer: FormControl<boolean | null>; details: FormControl<string> }>;

@Component({
  selector: 'app-person-form',
  imports: [ReactiveFormsModule, RouterLink, MaskDirective, EnrollmentSheetComponent],
  templateUrl: './person-form.component.html',
  styles: `
    .photo-preview { width: 120px; height: 160px; background: var(--bs-light); }
    .photo-preview img { width: 100%; height: 100%; object-fit: cover; }
  `,
})
export class PersonFormComponent implements OnInit {
  /** Vem da rota /cadastro/pessoas/:id; ausente ao criar */
  readonly id = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly personService = inject(PersonService);

  readonly states = STATES;
  readonly typeOptions = Object.entries(PERSON_TYPE_LABELS) as [PersonType, string][];
  readonly relationships = GUARDIAN_RELATIONSHIPS;
  readonly vaccinationOptions = Object.entries(VACCINATION_LABELS) as [VaccinationStatus, string][];
  readonly livesWithOptions = Object.entries(LIVES_WITH_LABELS) as [LivesWith, string][];
  readonly birthTypeOptions = Object.entries(BIRTH_TYPE_LABELS) as [BirthType, string][];
  readonly healthQuestions = HEALTH_QUESTIONS;
  readonly submitted = signal(false);
  readonly photoError = signal('');
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly loading = this.personService.loading;

  // Para adicionar campos: inclua aqui, no template e em toPerson/toFormValue (e na ficha, se for o caso)
  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.maxLength(150)]],
      cpf: this.fb.nonNullable.control('', {
        validators: [Validators.required, cpfValidator()],
        asyncValidators: [cpfUniqueValidator(cpf => this.personService.isCpfTaken(cpf, this.id()))],
      }),
      birthDate: ['', [Validators.required, pastDateValidator()]],
      nationality: ['Brasileira'],
      birthCity: [''],
      birthState: [''],
      susCard: ['', Validators.pattern(/^\d{3} \d{4} \d{4} \d{4}$/)],
      phone: [''],
      address: this.fb.nonNullable.group({
        cep: [''],
        street: [''],
        number: [''],
        complement: [''],
        district: [''],
        city: [''],
        state: [''],
      }),
      photo: [''],
      types: this.fb.nonNullable.group(
        { condutor: false, beneficiario: false, tutor: false } as Record<PersonType, boolean>,
        { validators: atLeastOneCheckedValidator() },
      ),
      guardianId: [''],
      guardianRelationship: [''],
      enrollment: this.fb.nonNullable.group({
        startDate: [''],
        endDate: [''],
        modality: ['', Validators.maxLength(100)],
      }),
      health: this.fb.nonNullable.group({
        ubsRegistration: [''],
        nearestHealthUnit: [''],
        hasHealthInsurance: this.fb.control<boolean | null>(null),
        healthInsuranceName: [''],
        vaccination: this.fb.control<VaccinationStatus | null>(null),
        livesWith: this.fb.control<LivesWith | null>(null),
        livesWithOther: [''],
        birthType: this.fb.control<BirthType | null>(null),
        answers: this.buildHealthAnswers(),
      }),
      imageConsent: this.fb.control<boolean | null>(null),
      consentGiven: [false, Validators.requiredTrue],
    },
    {
      validators: [
        guardianValidator(
          personId => this.personService.getById(personId)?.birthDate,
          () => this.id() ?? null,
        ),
        beneficiaryValidator(),
      ],
    },
  );

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly isBeneficiary = computed(() => !!this.formValue().types?.beneficiario);
  readonly isMinor = computed(() => isMinor(this.formValue().birthDate ?? ''));
  readonly photo = computed(() => this.formValue().photo ?? '');

  /** Só maiores de idade podem ser tutores; exclui a própria pessoa */
  readonly guardianOptions = computed(() =>
    this.personService
      .all()
      .filter(p => p.id !== this.id() && !isMinor(p.birthDate))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR')),
  );

  /** O que está digitado agora, para imprimir a ficha mesmo antes de salvar */
  readonly draft = computed<PersonDraft>(() => {
    this.formValue();
    const { id: _, ...draft } = this.toPerson(true);
    return draft;
  });

  readonly draftGuardian = computed(() => {
    const guardianId = this.formValue().guardianId;
    return guardianId ? (this.personService.getById(guardianId) ?? null) : null;
  });

  async ngOnInit(): Promise<void> {
    // Lista de responsáveis e pessoa em edição vêm do banco
    await this.personService.load();
    const id = this.id();
    if (!id) {
      return;
    }
    const person = this.personService.getById(id);
    if (!person) {
      this.router.navigate(['/cadastro/pessoas']);
      return;
    }
    this.form.patchValue(this.toFormValue(person));
    this.form.updateValueAndValidity();
  }

  showError(path: string, error?: string): boolean {
    const control = this.form.get(path);
    if (!control || !(control.touched || this.submitted())) {
      return false;
    }
    return error ? control.hasError(error) : control.invalid;
  }

  showFormError(error: string): boolean {
    return this.submitted() && this.form.hasError(error);
  }

  healthAnswer(key: HealthQuestionKey): boolean | null {
    return this.formValue().health?.answers?.[key]?.answer ?? null;
  }

  onPhotoSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    inputElement.value = '';
    if (!file) {
      return;
    }
    if (!PHOTO_TYPES.includes(file.type)) {
      this.photoError.set('Escolha uma foto em JPG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      this.photoError.set('A foto deve ter no máximo 2 MB.');
      return;
    }
    this.photoError.set('');
    const reader = new FileReader();
    reader.onload = () => this.form.controls.photo.setValue(reader.result as string);
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.form.controls.photo.setValue('');
  }

  print(): void {
    window.print();
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    this.saveError.set('');
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      await this.personService.save(this.toPerson());
      this.router.navigate(['/cadastro/pessoas']);
    } catch (error) {
      this.saveError.set(error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      this.saving.set(false);
    }
  }

  private buildHealthAnswers() {
    const controls = {} as Record<HealthQuestionKey, HealthAnswerGroup>;
    for (const question of HEALTH_QUESTIONS) {
      controls[question.key] = this.fb.group({
        answer: this.fb.control<boolean | null>(null),
        details: this.fb.nonNullable.control(''),
      });
    }
    return this.fb.nonNullable.group(controls);
  }

  /** `forPrint`: mantém matrícula e saúde mesmo se o tipo beneficiário ainda não estiver marcado */
  private toPerson(forPrint = false): Omit<Person, 'id'> & { id?: string } {
    const v = this.form.getRawValue();
    const beneficiary = v.types.beneficiario || forPrint;
    return {
      id: this.id(),
      fullName: v.fullName.trim(),
      cpf: onlyDigits(v.cpf),
      birthDate: v.birthDate,
      nationality: v.nationality.trim(),
      birthCity: v.birthCity.trim(),
      birthState: v.birthState,
      susCard: onlyDigits(v.susCard),
      phone: onlyDigits(v.phone),
      address: { ...v.address, cep: onlyDigits(v.address.cep) },
      photo: v.photo,
      types: this.typeOptions.map(([type]) => type).filter(type => v.types[type]),
      guardianId: v.guardianId || null,
      guardianRelationship: v.guardianId ? v.guardianRelationship : '',
      enrollment: beneficiary ? { ...v.enrollment, modality: v.enrollment.modality.trim() } : null,
      health: beneficiary
        ? {
            ...v.health,
            healthInsuranceName: v.health.hasHealthInsurance ? v.health.healthInsuranceName.trim() : '',
            livesWithOther: v.health.livesWith === 'outros' ? v.health.livesWithOther.trim() : '',
            answers: v.health.answers as Record<HealthQuestionKey, HealthAnswer>,
          }
        : null,
      imageConsent: beneficiary ? v.imageConsent : null,
      consentGiven: v.consentGiven,
    };
  }

  private toFormValue(person: Person): ReturnType<typeof this.form.getRawValue> {
    return {
      fullName: person.fullName,
      cpf: formatMask(person.cpf, 'cpf'),
      birthDate: person.birthDate,
      nationality: person.nationality,
      birthCity: person.birthCity,
      birthState: person.birthState,
      susCard: formatMask(person.susCard, 'sus'),
      phone: formatMask(person.phone, 'phone'),
      address: { ...person.address, cep: formatMask(person.address.cep, 'cep') },
      photo: person.photo,
      types: {
        condutor: person.types.includes('condutor'),
        beneficiario: person.types.includes('beneficiario'),
        tutor: person.types.includes('tutor'),
      },
      guardianId: person.guardianId ?? '',
      guardianRelationship: person.guardianRelationship,
      enrollment: person.enrollment ?? { startDate: '', endDate: '', modality: '' },
      health: person.health ?? emptyHealthRecord(),
      imageConsent: person.imageConsent,
      consentGiven: person.consentGiven,
    };
  }
}

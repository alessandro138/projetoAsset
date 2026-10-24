import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PERSON_TYPE_LABELS, Person, PersonType } from '../../../../models/person.model';
import { PersonService } from '../../../../services/person.service';
import { MaskDirective } from '../../../../shared/directives/mask.directive';
import { isMinor } from '../../../../shared/utils/date';
import { formatMask, onlyDigits } from '../../../../shared/utils/mask';
import { cpfUniqueValidator, cpfValidator } from '../../../../shared/validators/cpf.validator';
import { atLeastOneCheckedValidator, pastDateValidator } from '../../../../shared/validators/form.validators';
import { guardianValidator } from '../../../../shared/validators/guardian.validator';

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

@Component({
  selector: 'app-person-form',
  imports: [ReactiveFormsModule, RouterLink, MaskDirective],
  templateUrl: './person-form.component.html',
})
export class PersonFormComponent implements OnInit {
  /** Vem da rota /cadastro/pessoas/:id; ausente ao criar */
  readonly id = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly personService = inject(PersonService);

  readonly states = STATES;
  readonly typeOptions = Object.entries(PERSON_TYPE_LABELS) as [PersonType, string][];
  readonly submitted = signal(false);

  // Para adicionar campos: inclua aqui, no template e em toPerson/toFormValue
  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.maxLength(150)]],
      cpf: this.fb.nonNullable.control('', {
        validators: [Validators.required, cpfValidator()],
        asyncValidators: [cpfUniqueValidator(cpf => this.personService.isCpfTaken(cpf, this.id()))],
      }),
      birthDate: ['', [Validators.required, pastDateValidator()]],
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
      types: this.fb.nonNullable.group(
        { condutor: false, beneficiario: false, tutor: false } as Record<PersonType, boolean>,
        { validators: atLeastOneCheckedValidator() },
      ),
      guardianId: [''],
      consentGiven: [false, Validators.requiredTrue],
    },
    {
      validators: guardianValidator(
        personId => this.personService.getById(personId)?.birthDate,
        () => this.id() ?? null,
      ),
    },
  );

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly isBeneficiary = computed(() => !!this.formValue().types?.beneficiario);
  readonly isMinor = computed(() => isMinor(this.formValue().birthDate ?? ''));

  /** Só maiores de idade podem ser tutores; exclui a própria pessoa */
  readonly guardianOptions = computed(() =>
    this.personService
      .all()
      .filter(p => p.id !== this.id() && !isMinor(p.birthDate))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR')),
  );

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      return;
    }
    const person = this.personService.getById(id);
    if (!person) {
      this.router.navigate(['/cadastro/pessoas']);
      return;
    }
    this.form.setValue(this.toFormValue(person));
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

  save(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }
    this.personService.save(this.toPerson());
    this.router.navigate(['/cadastro/pessoas']);
  }

  private toPerson(): Omit<Person, 'id'> & { id?: string } {
    const v = this.form.getRawValue();
    return {
      id: this.id(),
      fullName: v.fullName.trim(),
      cpf: onlyDigits(v.cpf),
      birthDate: v.birthDate,
      phone: onlyDigits(v.phone),
      address: { ...v.address, cep: onlyDigits(v.address.cep) },
      types: this.typeOptions.map(([type]) => type).filter(type => v.types[type]),
      guardianId: v.guardianId || null,
      consentGiven: v.consentGiven,
    };
  }

  private toFormValue(person: Person): ReturnType<typeof this.form.getRawValue> {
    return {
      fullName: person.fullName,
      cpf: formatMask(person.cpf, 'cpf'),
      birthDate: person.birthDate,
      phone: formatMask(person.phone, 'phone'),
      address: { ...person.address, cep: formatMask(person.address.cep, 'cep') },
      types: {
        condutor: person.types.includes('condutor'),
        beneficiario: person.types.includes('beneficiario'),
        tutor: person.types.includes('tutor'),
      },
      guardianId: person.guardianId ?? '',
      consentGiven: person.consentGiven,
    };
  }
}

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Person } from '../../../../models/person.model';
import { PersonService } from '../../../../services/person.service';
import { PersonFormComponent } from './person-form.component';

describe('PersonFormComponent', () => {
  const thisYear = new Date().getFullYear();
  let service: PersonService;

  function create() {
    const fixture = TestBed.createComponent(PersonFormComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function fillValid(component: PersonFormComponent, birthDate: string) {
    component.form.patchValue({
      fullName: 'Maria da Silva',
      cpf: '529.982.247-25',
      birthDate,
      types: { beneficiario: true },
      enrollment: { startDate: `${thisYear}-02-01`, modality: 'Berçário' },
      imageConsent: true,
      consentGiven: true,
    });
  }

  function saveGuardian(): Person {
    return service.save({
      fullName: 'João Tutor',
      cpf: '11144477735',
      birthDate: `${thisYear - 40}-01-01`,
      nationality: 'Brasileira',
      birthCity: '',
      birthState: '',
      susCard: '',
      phone: '11999998888',
      address: { cep: '', street: 'Rua A', number: '1', complement: '', district: '', city: 'São Paulo', state: 'SP' },
      photo: '',
      types: ['tutor'],
      guardianId: null,
      guardianRelationship: '',
      enrollment: null,
      health: null,
      imageConsent: null,
      consentGiven: true,
    });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    service = TestBed.inject(PersonService);
  });

  it('saves an adult beneficiary without guardian, storing only CPF digits', () => {
    const component = create();
    fillValid(component, `${thisYear - 30}-05-10`);
    component.save();
    expect(service.all().length).toBe(1);
    const saved = service.all()[0];
    expect(saved.cpf).toBe('52998224725');
    expect(saved.types).toEqual(['beneficiario']);
    expect(saved.enrollment?.modality).toBe('Berçário');
    expect(saved.health).not.toBeNull();
  });

  it('does not keep enrollment and health data for non-beneficiaries', () => {
    const component = create();
    fillValid(component, `${thisYear - 30}-05-10`);
    component.form.patchValue({ types: { beneficiario: false, condutor: true } });
    component.save();
    const saved = service.all()[0];
    expect(saved.enrollment).toBeNull();
    expect(saved.health).toBeNull();
    expect(saved.imageConsent).toBeNull();
  });

  it('does not save a beneficiary without enrollment start, modality and image consent', () => {
    const component = create();
    fillValid(component, `${thisYear - 30}-05-10`);
    component.form.patchValue({ enrollment: { startDate: '', modality: '' }, imageConsent: null });
    component.save();
    expect(component.form.hasError('enrollmentStartRequired')).toBeTrue();
    expect(component.form.hasError('modalityRequired')).toBeTrue();
    expect(component.form.hasError('imageConsentRequired')).toBeTrue();
    expect(service.all().length).toBe(0);
  });

  it('does not save a minor beneficiary without guardian', () => {
    const component = create();
    fillValid(component, `${thisYear - 8}-05-10`);
    component.save();
    expect(component.form.hasError('guardianRequired')).toBeTrue();
    expect(service.all().length).toBe(0);
  });

  it('saves a minor beneficiary with an adult guardian and the relationship', () => {
    const guardian = saveGuardian();
    const component = create();
    fillValid(component, `${thisYear - 8}-05-10`);
    component.form.patchValue({ guardianId: guardian.id, guardianRelationship: 'Pai' });
    component.save();
    expect(service.all().length).toBe(2);
    expect(service.all()[1].guardianRelationship).toBe('Pai');
  });

  it('rejects a duplicated CPF', () => {
    const component = create();
    fillValid(component, `${thisYear - 30}-05-10`);
    component.save();

    const second = create();
    fillValid(second, `${thisYear - 25}-01-01`);
    second.save();
    expect(second.form.controls.cpf.hasError('cpfTaken')).toBeTrue();
    expect(service.all().length).toBe(1);
  });

  it('builds the printable draft from what was typed, before saving', () => {
    const guardian = saveGuardian();
    const component = create();
    fillValid(component, `${thisYear - 8}-05-10`);
    component.form.patchValue({
      guardianId: guardian.id,
      susCard: '898 0011 6040 9346',
      health: { answers: { allergy: { answer: true, details: 'Lactose' } } },
    });
    expect(component.draft().fullName).toBe('Maria da Silva');
    expect(component.draft().susCard).toBe('898001160409346');
    expect(component.draft().health?.answers.allergy).toEqual({ answer: true, details: 'Lactose' });
    expect(component.draftGuardian()?.fullName).toBe('João Tutor');
    expect(service.all().length).toBe(1);
  });
});

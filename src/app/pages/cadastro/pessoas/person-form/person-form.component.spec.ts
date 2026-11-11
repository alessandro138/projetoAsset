import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Person } from '../../../../models/person.model';
import { ModalityService } from '../../../../services/modality.service';
import { PersonService } from '../../../../services/person.service';
import { InMemoryModalityService } from '../../../../testing/in-memory-modality.service';
import { InMemoryPersonService } from '../../../../testing/in-memory-person.service';
import { PersonFormComponent } from './person-form.component';

describe('PersonFormComponent', () => {
  const thisYear = new Date().getFullYear();
  let service: InMemoryPersonService;

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
      enrollment: { startDate: `${thisYear}-02-01`, modalityId: 'm-jiu' },
      imageConsent: true,
      consentGiven: true,
    });
  }

  function saveGuardian(): Promise<Person> {
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
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: PersonService, useClass: InMemoryPersonService },
        { provide: ModalityService, useClass: InMemoryModalityService },
      ],
    }).compileComponents();
    service = TestBed.inject(PersonService) as unknown as InMemoryPersonService;
  });

  it('saves an adult beneficiary without guardian, storing only CPF digits', async () => {
    const component = create();
    fillValid(component, `${thisYear - 30}-05-10`);
    await component.save();
    expect(service.all().length).toBe(1);
    const saved = service.all()[0];
    expect(saved.cpf).toBe('52998224725');
    expect(saved.types).toEqual(['beneficiario']);
    expect(saved.enrollment?.modalityId).toBe('m-jiu');
    expect(saved.enrollment?.modality).toBe('Jiu-jítsu');
    expect(saved.health).not.toBeNull();
  });

  it('does not keep enrollment and health data for non-beneficiaries', async () => {
    const component = create();
    fillValid(component, `${thisYear - 30}-05-10`);
    component.form.patchValue({ types: { beneficiario: false, condutor: true } });
    await component.save();
    const saved = service.all()[0];
    expect(saved.enrollment).toBeNull();
    expect(saved.health).toBeNull();
    expect(saved.imageConsent).toBeNull();
  });

  it('does not save a beneficiary without enrollment start, modality and image consent', async () => {
    const component = create();
    fillValid(component, `${thisYear - 30}-05-10`);
    component.form.patchValue({ enrollment: { startDate: '', modalityId: '' }, imageConsent: null });
    await component.save();
    expect(component.form.hasError('enrollmentStartRequired')).toBeTrue();
    expect(component.form.hasError('modalityRequired')).toBeTrue();
    expect(component.form.hasError('imageConsentRequired')).toBeTrue();
    expect(service.all().length).toBe(0);
  });

  it('does not save a minor beneficiary without guardian', async () => {
    const component = create();
    fillValid(component, `${thisYear - 8}-05-10`);
    await component.save();
    expect(component.form.hasError('guardianRequired')).toBeTrue();
    expect(service.all().length).toBe(0);
  });

  it('saves a minor beneficiary with an adult guardian and the relationship', async () => {
    const guardian = await saveGuardian();
    const component = create();
    fillValid(component, `${thisYear - 8}-05-10`);
    component.form.patchValue({ guardianId: guardian.id, guardianRelationship: 'Pai' });
    await component.save();
    expect(service.all().length).toBe(2);
    expect(service.all()[1].guardianRelationship).toBe('Pai');
  });

  it('lists only active modalities, plus a deactivated one already in the enrollment', async () => {
    const component = create();
    expect(component.modalityOptions().map(m => m.name)).toEqual(['Jiu-jítsu', 'Ballet']);
    component.form.patchValue({ enrollment: { modalityId: 'm-antiga' } });
    expect(component.modalityOptions().map(m => m.name)).toEqual(['Jiu-jítsu', 'Ballet', 'Berçário']);
  });

  it('rejects a duplicated CPF', async () => {
    const component = create();
    fillValid(component, `${thisYear - 30}-05-10`);
    await component.save();

    const second = create();
    fillValid(second, `${thisYear - 25}-01-01`);
    await second.save();
    expect(second.form.controls.cpf.hasError('cpfTaken')).toBeTrue();
    expect(service.all().length).toBe(1);
  });

  it('builds the printable draft from what was typed, before saving', async () => {
    const guardian = await saveGuardian();
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

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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
    expect(service.all()[0].cpf).toBe('52998224725');
    expect(service.all()[0].types).toEqual(['beneficiario']);
  });

  it('does not save a minor beneficiary without guardian', () => {
    const component = create();
    fillValid(component, `${thisYear - 8}-05-10`);
    component.save();
    expect(component.form.hasError('guardianRequired')).toBeTrue();
    expect(service.all().length).toBe(0);
  });

  it('saves a minor beneficiary with an adult guardian', () => {
    const guardian = service.save({
      fullName: 'João Tutor',
      cpf: '11144477735',
      birthDate: `${thisYear - 40}-01-01`,
      phone: '',
      address: { cep: '', street: '', number: '', complement: '', district: '', city: '', state: '' },
      types: ['tutor'],
      guardianId: null,
      consentGiven: true,
    });
    const component = create();
    fillValid(component, `${thisYear - 8}-05-10`);
    component.form.controls.guardianId.setValue(guardian.id);
    component.save();
    expect(service.all().length).toBe(2);
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
});

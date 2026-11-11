import { TestBed } from '@angular/core/testing';

import { Person, emptyHealthRecord } from '../../../models/person.model';
import { EnrollmentSheetComponent, PersonDraft } from './enrollment-sheet.component';

describe('EnrollmentSheetComponent', () => {
  const thisYear = new Date().getFullYear();
  const address = { cep: '02879080', street: 'Rua Emílio Castro', number: '423', complement: '', district: 'Jardim Damasceno', city: 'São Paulo', state: 'SP' };

  const student: PersonDraft = {
    fullName: 'Ana Souza',
    cpf: '52998224725',
    birthDate: `${thisYear - 3}-03-05`,
    nationality: 'Brasileira',
    birthCity: 'São Paulo',
    birthState: 'SP',
    susCard: '898001160409346',
    phone: '',
    address,
    photo: '',
    types: ['beneficiario'],
    guardianId: 'g1',
    guardianRelationship: 'Mãe',
    enrollment: { startDate: `${thisYear}-02-01`, endDate: '', modality: 'Berçário' },
    health: {
      ...emptyHealthRecord(),
      vaccination: 'atualizado',
      answers: { ...emptyHealthRecord().answers, allergy: { answer: true, details: 'Lactose' } },
    },
    imageConsent: false,
    consentGiven: true,
  };

  const guardian: Person = {
    ...student,
    id: 'g1',
    fullName: 'Carla Souza',
    cpf: '11144477735',
    birthDate: `${thisYear - 30}-01-01`,
    phone: '11999998888',
    types: ['tutor'],
    guardianId: null,
    enrollment: null,
    health: null,
    imageConsent: null,
  };

  function render(person: PersonDraft, guardianInput: Person | null) {
    const fixture = TestBed.createComponent(EnrollmentSheetComponent);
    fixture.componentRef.setInput('person', person);
    fixture.componentRef.setInput('guardian', guardianInput);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('prints the three pages with the typed data', () => {
    const text = render(student, guardian);
    expect(text).toContain('FICHA DE MATRÍCULA');
    expect(text).toContain('FICHA DE SAÚDE');
    expect(text).toContain('Autorização para uso de imagens');
    expect(text).toContain('Ana Souza');
    expect(text).toContain('529.982.247-25');
    expect(text).toContain('898 0011 6040 9346');
    expect(text).toContain('Berçário');
    expect(text).toContain('SP / São Paulo');
    expect(text).toContain('Sim – Lactose');
  });

  it('fills the responsible data for minors', () => {
    const text = render(student, guardian);
    expect(text).toContain('Carla Souza');
    expect(text).toContain('111.444.777-35');
    expect(text).toContain('Mãe');
    expect(text).toContain('(11) 99999-8888');
  });

  it('leaves the responsible data blank for adults', () => {
    const text = render({ ...student, birthDate: `${thisYear - 20}-01-01` }, guardian);
    expect(text).not.toContain('Carla Souza');
  });
});

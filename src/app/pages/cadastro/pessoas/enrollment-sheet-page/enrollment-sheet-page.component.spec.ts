import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Person, emptyHealthRecord } from '../../../../models/person.model';
import { PersonService } from '../../../../services/person.service';
import { InMemoryPersonService } from '../../../../testing/in-memory-person.service';
import { EnrollmentSheetPageComponent } from './enrollment-sheet-page.component';

describe('EnrollmentSheetPageComponent', () => {
  const thisYear = new Date().getFullYear();

  function student(modality: string): Omit<Person, 'id'> {
    return {
      fullName: 'Bruno Lima',
      cpf: '52998224725',
      rg: '',
      birthDate: `${thisYear - 20}-03-05`,
      nationality: 'Brasileira',
      birthCity: 'São Paulo',
      birthState: 'SP',
      susCard: '',
      phone: '',
      address: { cep: '', street: '', number: '', complement: '', district: '', city: '', state: '' },
      photo: '',
      types: ['beneficiario'],
      guardianId: null,
      guardianRelationship: '',
      enrollment: { startDate: `${thisYear}-02-01`, endDate: '', modalityId: 'm1', modality },
      health: emptyHealthRecord(),
      imageConsent: true,
      consentGiven: true,
    };
  }

  async function open(modality: string) {
    const people = new InMemoryPersonService();
    const saved = await people.save(student(modality));
    TestBed.configureTestingModule({
      imports: [EnrollmentSheetPageComponent],
      providers: [provideRouter([{ path: '**', children: [] }]), { provide: PersonService, useValue: people }],
    });
    const fixture = TestBed.createComponent(EnrollmentSheetPageComponent);
    fixture.componentRef.setInput('id', saved.id);
    fixture.detectChanges();
    return fixture;
  }

  function buttons(element: HTMLElement): string[] {
    return Array.from(element.querySelectorAll('button')).map(b => b.textContent!.trim());
  }

  it('offers "Imprimir termo" for Kickboxing and shows the term', async () => {
    const fixture = await open('Kickboxing');
    const element = fixture.nativeElement as HTMLElement;
    expect(buttons(element)).toContain('Imprimir termo');
    expect(element.querySelector('app-commitment-term')?.textContent).toContain('Eu, Bruno Lima,');
  });

  it('has no term for other modalities', async () => {
    const fixture = await open('Ballet');
    const element = fixture.nativeElement as HTMLElement;
    expect(buttons(element)).not.toContain('Imprimir termo');
    expect(element.querySelector('app-commitment-term')).toBeNull();
  });

  it('prints only the term when "Imprimir termo" is clicked', async () => {
    const fixture = await open('Jiu-jítsu');
    const print = spyOn(window, 'print');
    const element = fixture.nativeElement as HTMLElement;
    const previews = () => Array.from(element.querySelectorAll('.sheet-preview'));

    fixture.componentInstance.print('term');
    expect(print).toHaveBeenCalled();
    expect(previews().map(p => p.classList.contains('d-print-none'))).toEqual([true, false]);

    fixture.componentInstance.print('sheet');
    expect(previews().map(p => p.classList.contains('d-print-none'))).toEqual([false, true]);
  });
});

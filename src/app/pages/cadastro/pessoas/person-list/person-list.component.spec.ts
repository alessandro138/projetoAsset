import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Person } from '../../../../models/person.model';
import { PersonService } from '../../../../services/person.service';
import { InMemoryPersonService } from '../../../../testing/in-memory-person.service';
import { PersonListComponent } from './person-list.component';

describe('PersonListComponent', () => {
  const thisYear = new Date().getFullYear();

  function adult(fullName: string, cpf: string): Omit<Person, 'id'> {
    return {
      fullName,
      cpf,
      rg: '',
      birthDate: `${thisYear - 30}-03-05`,
      nationality: '',
      birthCity: '',
      birthState: '',
      susCard: '',
      phone: '',
      address: { cep: '', street: '', number: '', complement: '', district: '', city: '', state: '' },
      photo: '',
      types: ['tutor'],
      guardianId: null,
      guardianRelationship: '',
      enrollment: null,
      health: null,
      imageConsent: null,
      consentGiven: true,
      createdAt: new Date(thisYear, 1, 10, 12, 0).toISOString(),
    };
  }

  async function open() {
    const people = new InMemoryPersonService();
    const ana = await people.save(adult('Ana Souza', '52998224725'));
    await people.save(adult('Bruno Lima', '11144477735'));
    TestBed.configureTestingModule({
      imports: [PersonListComponent],
      providers: [provideRouter([{ path: '**', children: [] }]), { provide: PersonService, useValue: people }],
    });
    const fixture = TestBed.createComponent(PersonListComponent);
    fixture.detectChanges();
    return { fixture, people, ana, element: fixture.nativeElement as HTMLElement };
  }

  function names(element: HTMLElement): string[] {
    return Array.from(element.querySelectorAll('tbody td:first-child .fw-bold')).map(e => e.textContent!.trim());
  }

  function clickButton(element: HTMLElement, text: string, root: ParentNode = element): void {
    const button = Array.from(root.querySelectorAll('button')).find(b => b.textContent!.includes(text));
    expect(button).withContext(text).toBeTruthy();
    button!.click();
  }

  it('shows the registration date', async () => {
    const { element } = await open();
    expect(element.querySelector('thead')!.textContent).toContain('Cadastrado em');
    expect(element.querySelector('tbody')!.textContent).toContain(`10/02/${thisYear}`);
  });

  it('asks for confirmation and deactivates the registration', async () => {
    const { fixture, people, ana, element } = await open();
    const row = element.querySelector('tbody tr')!;
    clickButton(element, 'Desativar', row);
    fixture.detectChanges();

    const dialog = element.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Ana Souza');
    clickButton(element, 'Sim, desativar', dialog);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(people.getById(ana.id)!.deactivatedAt).toBeTruthy();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(names(element)).toEqual(['Bruno Lima']);
    expect(element.textContent).toContain('O cadastro de Ana Souza foi desativado.');

    // Desativados aparecem quando pedido, com a data da desativação
    const toggle = element.querySelector<HTMLInputElement>('#showDeactivated')!;
    toggle.click();
    fixture.detectChanges();
    expect(names(element)).toEqual(['Ana Souza', 'Bruno Lima']);
    expect(element.textContent).toContain('Desativado em');
  });

  it('reactivates a deactivated registration after confirmation', async () => {
    const { fixture, people, ana, element } = await open();
    await people.deactivate(ana.id);
    fixture.detectChanges();
    element.querySelector<HTMLInputElement>('#showDeactivated')!.click();
    fixture.detectChanges();

    const anaRow = element.querySelector('tbody tr')!;
    expect(anaRow.textContent).toContain('Desativado em');
    clickButton(element, 'Reativar', anaRow);
    fixture.detectChanges();
    const dialog = element.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Reativar cadastro');
    clickButton(element, 'Sim, reativar', dialog);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(people.getById(ana.id)!.deactivatedAt).toBeNull();
    expect(element.textContent).toContain('O cadastro de Ana Souza foi reativado.');
    expect(element.querySelector('#showDeactivated')).toBeNull();
    expect(names(element)).toEqual(['Ana Souza', 'Bruno Lima']);
  });

  it('filters the loaded list by name (ignoring accents and case) and by document number', async () => {
    const { fixture, element } = await open();
    const input = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    const type = (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    type('BRÚNO');
    expect(names(element)).toEqual(['Bruno Lima']);
    expect(element.textContent).toContain('1 de 2 cadastros');

    type('529.982');
    expect(names(element)).toEqual(['Ana Souza']);

    type('zzz');
    expect(names(element)).toEqual([]);
    expect(element.textContent).toContain('Nenhum cadastro encontrado para "zzz"');

    type('');
    expect(names(element)).toEqual(['Ana Souza', 'Bruno Lima']);
  });

  it('warns when the search matches hidden deactivated registrations', async () => {
    const { fixture, people, ana, element } = await open();
    await people.deactivate(ana.id);
    fixture.detectChanges();
    const input = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = 'ana';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(names(element)).toEqual([]);
    expect(element.textContent).toContain('1 cadastro desativado também corresponde');
    clickButton(element, 'mostrar');
    fixture.detectChanges();
    expect(names(element)).toEqual(['Ana Souza']);
  });

  it('keeps the registration when the confirmation is cancelled', async () => {
    const { fixture, people, ana, element } = await open();
    clickButton(element, 'Desativar', element.querySelector('tbody tr')!);
    fixture.detectChanges();
    clickButton(element, 'Cancelar', element.querySelector('.modal-footer')!);
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(people.getById(ana.id)!.deactivatedAt).toBeFalsy();
    expect(names(element)).toEqual(['Ana Souza', 'Bruno Lima']);
  });
});

import { TestBed } from '@angular/core/testing';

import { commitmentTermFor } from '../../../models/commitment-terms';
import { CommitmentTermComponent } from './commitment-term.component';

describe('CommitmentTermComponent', () => {
  function render(modality: string, studentName = 'Ana Souza') {
    const fixture = TestBed.createComponent(CommitmentTermComponent);
    fixture.componentRef.setInput('term', commitmentTermFor(modality));
    fixture.componentRef.setInput('studentName', studentName);
    fixture.componentRef.setInput('date', new Date(2026, 10, 11));
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
  }

  it('fills the student name and the date in the Jiu-jítsu term', () => {
    const text = render('Jiu-jítsu');
    expect(text).toContain('Eu, Ana Souza, aluno (a) matriculado (a)');
    expect(text).toContain('MICHAEL DOS SANTOS e RICHARD FRAGA');
    expect(text).toContain('São Paulo, 11 de novembro de 2026.');
    expect(text).not.toContain('____');
    expect(text).not.toContain('TERMO DE COMPROMISSO');
  });

  it('prints the title of the Kickboxing term', () => {
    const text = render('Kickboxing');
    expect(text).toContain('TERMO DE COMPROMISSO');
    expect(text).toContain('Eu, Ana Souza, aluno (a)');
    expect(text).toContain('instrutor Moyses Pereira');
  });

  it('keeps the blank line when the name was not typed yet', () => {
    expect(render('Kickboxing', '  ')).toContain(`Eu, ${'_'.repeat(50)}, aluno (a)`);
  });
});

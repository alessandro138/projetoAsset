import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Person } from '../models/person.model';

// Armazenamento em memória até existir backend. Não persistir dados pessoais em localStorage (LGPD).
@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly people = signal<Person[]>([]);

  readonly all = this.people.asReadonly();

  getById(id: string): Person | undefined {
    return this.people().find(p => p.id === id);
  }

  isCpfTaken(cpf: string, ignoreId?: string): Observable<boolean> {
    return of(this.people().some(p => p.cpf === cpf && p.id !== ignoreId));
  }

  save(person: Omit<Person, 'id'> & { id?: string }): Person {
    const saved: Person = { ...person, id: person.id ?? crypto.randomUUID() };
    this.people.update(list =>
      list.some(p => p.id === saved.id) ? list.map(p => (p.id === saved.id ? saved : p)) : [...list, saved],
    );
    return saved;
  }
}

import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Person } from '../models/person.model';
import { PersonInput } from '../services/person.service';

/** Substituto do PersonService nos testes: mesma interface, sem Supabase */
@Injectable()
export class InMemoryPersonService {
  private readonly people = signal<Person[]>([]);
  readonly all = this.people.asReadonly();
  readonly loading = signal(false);
  readonly loadError = signal('');

  load(): Promise<void> {
    return Promise.resolve();
  }

  clear(): void {
    this.people.set([]);
  }

  getById(id: string): Person | undefined {
    return this.people().find(p => p.id === id);
  }

  isCpfTaken(cpf: string, ignoreId?: string): Observable<boolean> {
    return of(this.people().some(p => p.cpf === cpf && p.id !== ignoreId));
  }

  async save(person: PersonInput): Promise<Person> {
    const saved: Person = { ...person, id: person.id ?? crypto.randomUUID() };
    this.people.update(list =>
      list.some(p => p.id === saved.id) ? list.map(p => (p.id === saved.id ? saved : p)) : [...list, saved],
    );
    return saved;
  }
}

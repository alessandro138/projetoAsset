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
    const existing = person.id ? this.getById(person.id) : undefined;
    // Como no banco, a data de cadastro e a desativação não mudam ao salvar
    const saved: Person = {
      ...person,
      id: person.id ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? person.createdAt ?? new Date().toISOString(),
      deactivatedAt: existing ? (existing.deactivatedAt ?? null) : (person.deactivatedAt ?? null),
    };
    this.people.update(list =>
      list.some(p => p.id === saved.id) ? list.map(p => (p.id === saved.id ? saved : p)) : [...list, saved],
    );
    return saved;
  }

  async deactivate(id: string): Promise<void> {
    this.people.update(list => list.map(p => (p.id === id ? { ...p, deactivatedAt: new Date().toISOString() } : p)));
  }

  async reactivate(id: string): Promise<void> {
    this.people.update(list => list.map(p => (p.id === id ? { ...p, deactivatedAt: null } : p)));
  }
}

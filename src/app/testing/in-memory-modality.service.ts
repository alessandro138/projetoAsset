import { Injectable, signal } from '@angular/core';

import { Modality } from '../models/person.model';

export const TEST_MODALITIES: Modality[] = [
  { id: 'm-jiu', name: 'Jiu-jítsu', active: true },
  { id: 'm-ballet', name: 'Ballet', active: true },
  { id: 'm-antiga', name: 'Berçário', active: false },
];

/** Substituto do ModalityService nos testes: mesma interface, sem Supabase */
@Injectable()
export class InMemoryModalityService {
  readonly all = signal<Modality[]>(TEST_MODALITIES).asReadonly();
  readonly loadError = signal('');

  load(): Promise<void> {
    return Promise.resolve();
  }
}

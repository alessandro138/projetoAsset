import { Injectable, signal } from '@angular/core';

import { SiteContent } from '../models/site-content.model';
import { DEFAULT_SITE_CONTENT } from './default-site-content';

// Em memória até existir backend; as telas administrativas usarão update() para salvar alterações.
@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly content = signal<SiteContent>(structuredClone(DEFAULT_SITE_CONTENT));

  readonly current = this.content.asReadonly();

  update(content: SiteContent): void {
    this.content.set(structuredClone(content));
  }
}

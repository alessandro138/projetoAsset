import { Component, computed, inject, signal } from '@angular/core';

import { Unit } from '../../models/site-content.model';
import { SiteContentService } from '../../services/site-content.service';

/** Unidades da ASSET em cards compactos (conteúdo editável em SiteContentService) */
@Component({
  selector: 'app-unidades',
  templateUrl: './unidades.component.html',
  styleUrl: './unidades.component.scss',
})
export class UnidadesComponent {
  readonly content = inject(SiteContentService).current;
  readonly search = signal('');

  readonly units = computed(() => {
    const term = normalize(this.search());
    const items = this.content().units.items;
    return term ? items.filter(u => normalize(`${u.name} ${u.neighborhood}`).includes(term)) : items;
  });

  mapsUrl(unit: Unit): string {
    const query = [unit.address, unit.cep].filter(Boolean).join(' ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  phoneHref(phone: string): string {
    return `tel:+55${phone.replace(/\D/g, '')}`;
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}

/** Busca sem diferenciar maiúsculas e acentos */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

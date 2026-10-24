import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Link que aceita o que o administrador digitar: âncora da página principal ('#projetos'),
 * rota interna ('/cadastro') ou URL externa ('https://...', 'mailto:...').
 */
@Component({
  selector: 'app-smart-link',
  imports: [RouterLink, NgTemplateOutlet],
  template: `
    <ng-template #content><ng-content /></ng-template>
    @switch (kind()) {
      @case ('anchor') {
        <a [class]="linkClass()" routerLink="/principal" [fragment]="fragment()">
          <ng-container [ngTemplateOutlet]="content" />
        </a>
      }
      @case ('internal') {
        <a [class]="linkClass()" [routerLink]="href()"><ng-container [ngTemplateOutlet]="content" /></a>
      }
      @case ('external') {
        <a [class]="linkClass()" [href]="href()" target="_blank" rel="noopener">
          <ng-container [ngTemplateOutlet]="content" />
        </a>
      }
      @default {
        <a [class]="linkClass()" [href]="href()"><ng-container [ngTemplateOutlet]="content" /></a>
      }
    }
  `,
  styles: `:host { display: contents; }`,
})
export class SmartLinkComponent {
  readonly href = input.required<string>();
  readonly linkClass = input('');

  readonly kind = computed(() => {
    const href = this.href();
    if (href.startsWith('#')) {
      return 'anchor';
    }
    if (href.startsWith('/')) {
      return 'internal';
    }
    // mailto:, tel: etc. abrem na mesma aba
    return /^https?:/i.test(href) ? 'external' : 'protocol';
  });

  readonly fragment = computed(() => this.href().slice(1));
}

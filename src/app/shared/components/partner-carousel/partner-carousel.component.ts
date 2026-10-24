import { Component, DestroyRef, HostListener, afterNextRender, computed, inject, input, signal } from '@angular/core';

import { Partner } from '../../../models/site-content.model';

/**
 * Carrossel de logos no visual do template (cards rounded-4, botões em degradê).
 * Avança sozinho, pausa com o mouse ou o foco sobre ele e não anima para quem pediu menos movimento no sistema.
 */
@Component({
  selector: 'app-partner-carousel',
  templateUrl: './partner-carousel.component.html',
  styleUrl: './partner-carousel.component.scss',
})
export class PartnerCarouselComponent {
  readonly partners = input.required<Partner[]>();
  readonly intervalMs = input(3000);

  private readonly viewportWidth = signal(typeof window === 'undefined' ? 1200 : window.innerWidth);
  private readonly paused = signal(false);
  private readonly position = signal(0);

  /** Quantos logos aparecem lado a lado, conforme a largura da tela */
  readonly perView = computed(() => {
    const width = this.viewportWidth();
    if (width < 576) {
      return 2;
    }
    return width < 992 ? 3 : 5;
  });

  readonly lastIndex = computed(() => Math.max(0, this.partners().length - this.perView()));
  readonly index = computed(() => Math.min(this.position(), this.lastIndex()));
  readonly pages = computed(() => Array.from({ length: this.lastIndex() + 1 }, (_, i) => i));
  readonly transform = computed(() => `translateX(-${(this.index() * 100) / this.perView()}%)`);
  readonly itemWidth = computed(() => `${100 / this.perView()}%`);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      const timer = setInterval(() => {
        if (!this.paused()) {
          this.next();
        }
      }, this.intervalMs());
      destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  next(): void {
    this.position.set(this.index() >= this.lastIndex() ? 0 : this.index() + 1);
  }

  previous(): void {
    this.position.set(this.index() <= 0 ? this.lastIndex() : this.index() - 1);
  }

  goTo(page: number): void {
    this.position.set(page);
  }

  setPaused(paused: boolean): void {
    this.paused.set(paused);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.viewportWidth.set(window.innerWidth);
  }
}

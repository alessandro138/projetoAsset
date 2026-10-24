import { Component } from '@angular/core';

/** Coluna de pontos decorativa do template Start Bootstrap - Personal. A cor vem de `fill` no CSS do pai. */
@Component({
  selector: 'app-svg-dots',
  template: `
    <svg viewBox="0 0 10 128" aria-hidden="true">
      @for (cy of positions; track cy) {
        <circle cx="5" [attr.cy]="cy" r="3.2" />
      }
    </svg>
  `,
  styles: `:host { display: block; } svg { display: block; width: 100%; height: auto; }`,
})
export class SvgDotsComponent {
  readonly positions = Array.from({ length: 20 }, (_, i) => 5 + i * 6.2);
}

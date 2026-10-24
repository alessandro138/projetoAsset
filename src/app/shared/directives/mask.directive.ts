import { Directive, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

import { MaskType, formatMask } from '../utils/mask';

/** Formata o campo enquanto o usuário digita. Uso: <input formControlName="cpf" appMask="cpf"> */
@Directive({
  selector: '[appMask]',
})
export class MaskDirective {
  readonly appMask = input.required<MaskType>();

  private readonly ngControl = inject(NgControl);

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    const formatted = formatMask(value, this.appMask());
    if (formatted !== value) {
      this.ngControl.control?.setValue(formatted);
    }
  }
}

import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { SiteContentService } from '../../services/site-content.service';
import { PartnerCarouselComponent } from '../../shared/components/partner-carousel/partner-carousel.component';
import { SmartLinkComponent } from '../../shared/components/smart-link/smart-link.component';
import { SvgDotsComponent } from '../../shared/components/svg-dots/svg-dots.component';
import { parseIsoDate } from '../../shared/utils/date';

// Layout do template Start Bootstrap - Personal. Todo o conteúdo vem do SiteContentService (editável pelo administrador).
@Component({
  selector: 'app-principal',
  imports: [DatePipe, SmartLinkComponent, SvgDotsComponent, PartnerCarouselComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent {
  readonly content = inject(SiteContentService).current;

  readonly socialLinks = computed(() => {
    const social = this.content().social;
    return [
      { icon: 'bi-facebook', label: 'Facebook', href: social.facebook },
      { icon: 'bi-instagram', label: 'Instagram', href: social.instagram },
      { icon: 'bi-youtube', label: 'YouTube', href: social.youtube },
      { icon: 'bi-whatsapp', label: 'WhatsApp', href: social.whatsapp ? `https://wa.me/${social.whatsapp.replace(/\D/g, '')}` : '' },
    ].filter(link => link.href);
  });

  /** Datas 'AAAA-MM-DD' como data local (sem o deslocamento de fuso do DatePipe com strings) */
  toDate(isoDate: string): Date | null {
    return parseIsoDate(isoDate);
  }

  phoneHref(phone: string): string {
    return `tel:+55${phone.replace(/\D/g, '')}`;
  }
}

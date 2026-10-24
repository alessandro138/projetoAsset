import { TestBed } from '@angular/core/testing';

import { Partner } from '../../../models/site-content.model';
import { PartnerCarouselComponent } from './partner-carousel.component';

describe('PartnerCarouselComponent', () => {
  const partners: Partner[] = Array.from({ length: 13 }, (_, i) => ({
    name: `Parceiro ${i + 1}`,
    logoUrl: `logo-${i + 1}.png`,
    url: '',
  }));

  function create() {
    const fixture = TestBed.createComponent(PartnerCarouselComponent);
    fixture.componentRef.setInput('partners', partners);
    fixture.componentRef.setInput('intervalMs', 60_000);
    fixture.detectChanges();
    return fixture;
  }

  it('renders one card per partner', () => {
    const fixture = create();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.partner-card').length).toBe(13);
  });

  it('wraps around at both ends', () => {
    const component = create().componentInstance;
    const last = component.lastIndex();
    expect(last).toBe(13 - component.perView());

    component.previous();
    expect(component.index()).toBe(last);

    component.next();
    expect(component.index()).toBe(0);
  });

  it('jumps to a position from the indicators', () => {
    const component = create().componentInstance;
    component.goTo(2);
    expect(component.index()).toBe(2);
    expect(component.transform()).toBe(`translateX(-${(2 * 100) / component.perView()}%)`);
  });
});

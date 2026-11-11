import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DEFAULT_SITE_CONTENT } from '../../services/default-site-content';
import { SiteContentService } from '../../services/site-content.service';
import { UnidadesComponent } from './unidades.component';

describe('UnidadesComponent', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [UnidadesComponent],
      providers: [{ provide: SiteContentService, useValue: { current: signal(DEFAULT_SITE_CONTENT) } }],
    });
    const fixture = TestBed.createComponent(UnidadesComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders one card per unit', () => {
    const fixture = create();
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.unit-card');
    expect(cards.length).toBe(DEFAULT_SITE_CONTENT.units.items.length);
  });

  it('filters by name or neighborhood ignoring case and accents', () => {
    const component = create().componentInstance;
    component.search.set('criança');
    expect(component.units().map(u => u.id)).toEqual(['arte-e-crianca']);
    component.search.set('VILA SOUZA');
    expect(component.units().map(u => u.id)).toEqual(['novo-ser']);
    component.search.set('jd. elisa');
    expect(component.units().map(u => u.id)).toEqual(['plenitude']);
  });

  it('builds a Google Maps search link with address and CEP', () => {
    const component = create().componentInstance;
    const unit = DEFAULT_SITE_CONTENT.units.items.find(u => u.id === 'novo-ser')!;
    expect(component.mapsUrl(unit)).toBe(
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent('Av. Deputado Cantídio Sampaio, 3540/3542 – São Paulo/SP 02856-024'),
    );
  });
});

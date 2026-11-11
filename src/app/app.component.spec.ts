import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { DEFAULT_SITE_CONTENT } from './services/default-site-content';
import { PersonService } from './services/person.service';
import { SiteContentService } from './services/site-content.service';
import { InMemoryPersonService } from './testing/in-memory-person.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: SiteContentService, useValue: { current: signal(DEFAULT_SITE_CONTENT), load: () => Promise.resolve() } },
        { provide: AuthService, useValue: { isLoggedIn: signal(false), email: signal(''), signOut: () => Promise.resolve() } },
        { provide: PersonService, useClass: InMemoryPersonService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the main navigation and the footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const navText = element.querySelector('nav')?.textContent ?? '';
    expect(navText).toContain('Início');
    expect(navText).toContain('Área restrita');
    expect(element.querySelector('footer')?.textContent).toContain('ASSET');
  });
});

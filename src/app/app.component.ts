import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from './services/auth.service';
import { PersonService } from './services/person.service';
import { SiteContentService } from './services/site-content.service';
import { SmartLinkComponent } from './shared/components/smart-link/smart-link.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SmartLinkComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly siteContent = inject(SiteContentService);
  private readonly personService = inject(PersonService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly footer = computed(() => this.siteContent.current().footer);
  readonly year = new Date().getFullYear();

  // Substituem o JavaScript do Bootstrap (collapse/dropdown) no menu
  readonly menuOpen = signal(false);
  readonly adminMenuOpen = signal(false);

  constructor() {
    this.siteContent.load();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.closeMenus());
  }

  toggleAdminMenu(event: Event): void {
    event.stopPropagation();
    this.adminMenuOpen.update(open => !open);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    // Dados pessoais carregados não ficam na memória depois de sair
    this.personService.clear();
    this.router.navigate(['/principal']);
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeAdminMenu(): void {
    this.adminMenuOpen.set(false);
  }

  private closeMenus(): void {
    this.menuOpen.set(false);
    this.adminMenuOpen.set(false);
  }
}

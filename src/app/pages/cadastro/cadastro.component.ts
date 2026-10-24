import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-cadastro',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section class="container px-4 px-lg-5 py-5">
      <ul class="nav nav-underline mb-4">
        <li class="nav-item"><a class="nav-link" routerLink="pessoas" routerLinkActive="active">Pessoas</a></li>
        <li class="nav-item"><a class="nav-link" routerLink="usuarios" routerLinkActive="active">Usuários</a></li>
      </ul>
      <router-outlet />
    </section>
  `,
  styles: `.nav-link.active { color: var(--bs-secondary); }`,
})
export class CadastroComponent {}

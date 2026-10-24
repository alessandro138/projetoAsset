import { Routes } from '@angular/router';

// TODO: proteger /cadastro e /ativosPatrimonio com guard de autenticação (LGPD) quando houver login
export const routes: Routes = [
  { path: '', redirectTo: 'principal', pathMatch: 'full' },
  {
    path: 'principal',
    title: 'ASSET',
    loadComponent: () => import('./pages/principal/principal.component').then(m => m.PrincipalComponent),
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro.component').then(m => m.CadastroComponent),
    children: [
      { path: '', redirectTo: 'pessoas', pathMatch: 'full' },
      {
        path: 'usuarios',
        title: 'Usuários | ASSET',
        loadComponent: () => import('./pages/cadastro/usuarios/usuarios.component').then(m => m.UsuariosComponent),
      },
      {
        path: 'pessoas',
        title: 'Pessoas | ASSET',
        loadComponent: () =>
          import('./pages/cadastro/pessoas/person-list/person-list.component').then(m => m.PersonListComponent),
      },
      {
        path: 'pessoas/nova',
        title: 'Nova pessoa | ASSET',
        loadComponent: () =>
          import('./pages/cadastro/pessoas/person-form/person-form.component').then(m => m.PersonFormComponent),
      },
      {
        path: 'pessoas/:id',
        title: 'Editar pessoa | ASSET',
        loadComponent: () =>
          import('./pages/cadastro/pessoas/person-form/person-form.component').then(m => m.PersonFormComponent),
      },
    ],
  },
  {
    path: 'ativosPatrimonio',
    title: 'Ativos e patrimônio | ASSET',
    loadComponent: () =>
      import('./pages/ativos-patrimonio/ativos-patrimonio.component').then(m => m.AtivosPatrimonioComponent),
  },
  { path: '**', redirectTo: 'principal' },
];

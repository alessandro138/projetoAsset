import { Routes } from '@angular/router';

import { roleGuard } from './guards/role.guard';

// Área restrita: o guard evita telas sem permissão; a proteção dos dados é do banco (RLS)
export const routes: Routes = [
  { path: '', redirectTo: 'principal', pathMatch: 'full' },
  {
    path: 'principal',
    title: 'ASSET',
    loadComponent: () => import('./pages/principal/principal.component').then(m => m.PrincipalComponent),
  },
  {
    path: 'login',
    title: 'Área restrita | ASSET',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro.component').then(m => m.CadastroComponent),
    children: [
      { path: '', redirectTo: 'pessoas', pathMatch: 'full' },
      {
        path: 'usuarios',
        title: 'Usuários | ASSET',
        canActivate: [roleGuard('admin')],
        loadComponent: () => import('./pages/cadastro/usuarios/usuarios.component').then(m => m.UsuariosComponent),
      },
      {
        path: 'pessoas',
        canActivate: [roleGuard('admin', 'secretaria')],
        children: [
          {
            path: '',
            title: 'Pessoas | ASSET',
            loadComponent: () =>
              import('./pages/cadastro/pessoas/person-list/person-list.component').then(m => m.PersonListComponent),
          },
          {
            path: 'nova',
            title: 'Nova pessoa | ASSET',
            loadComponent: () =>
              import('./pages/cadastro/pessoas/person-form/person-form.component').then(m => m.PersonFormComponent),
          },
          {
            path: ':id/ficha',
            title: 'Ficha de matrícula | ASSET',
            loadComponent: () =>
              import('./pages/cadastro/pessoas/enrollment-sheet-page/enrollment-sheet-page.component').then(
                m => m.EnrollmentSheetPageComponent,
              ),
          },
          {
            path: ':id',
            title: 'Editar pessoa | ASSET',
            loadComponent: () =>
              import('./pages/cadastro/pessoas/person-form/person-form.component').then(m => m.PersonFormComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'ativosPatrimonio',
    title: 'Ativos e patrimônio | ASSET',
    canActivate: [roleGuard('admin', 'secretaria')],
    loadComponent: () =>
      import('./pages/ativos-patrimonio/ativos-patrimonio.component').then(m => m.AtivosPatrimonioComponent),
  },
  { path: '**', redirectTo: 'principal' },
];

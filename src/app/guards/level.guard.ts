import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AccessLevel } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/**
 * Libera a rota só para usuários logados, ativos e com pelo menos o nível informado.
 * Sem login: vai para /login e volta depois. Primeiro acesso: troca a senha antes.
 * Sem permissão: /login mostra o aviso.
 * A proteção real dos dados é do banco (RLS); o guard só evita telas que dariam erro.
 */
export function levelGuard(minimum: AccessLevel): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.ready();

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login'], { queryParams: { voltar: state.url } });
    }
    if (auth.mustChangePassword()) {
      return router.createUrlTree(['/trocar-senha'], { queryParams: { voltar: state.url } });
    }
    if (!auth.hasLevel(minimum)) {
      return router.createUrlTree(['/login'], { queryParams: { semPermissao: 1 } });
    }
    return true;
  };
}

/** Só exige estar logado (ex.: tela de troca de senha) */
export const loggedInGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  await auth.ready();
  return auth.isLoggedIn() || inject(Router).createUrlTree(['/login'], { queryParams: { voltar: state.url } });
};

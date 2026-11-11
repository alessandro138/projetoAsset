import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService, UserRole } from '../services/auth.service';

/**
 * Libera a rota só para usuários logados, ativos e com um dos perfis.
 * Sem login: vai para /login e volta depois. Sem permissão: /login mostra o aviso.
 * A proteção real dos dados é do banco (RLS); o guard só evita telas que dariam erro.
 */
export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.ready();

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login'], { queryParams: { voltar: state.url } });
    }
    if (!auth.hasRole(...roles)) {
      return router.createUrlTree(['/login'], { queryParams: { semPermissao: 1 } });
    }
    return true;
  };
}

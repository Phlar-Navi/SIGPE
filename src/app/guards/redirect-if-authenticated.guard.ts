import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const redirectIfAuthenticatedGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const user = await authService.getUserData();

    if (user) {
      await router.navigate(['/home']); // ou la route par défaut selon ton app
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur dans redirectIfAuthenticatedGuard:', error);
    return true; // autorise quand erreur de récupération (ou gère différemment si besoin)
  }
};

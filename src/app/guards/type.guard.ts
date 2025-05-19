import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const typeGuard = (allowedTypes: string[]): CanActivateFn => {
  return async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = await authService.getUserData();

    if (user && allowedTypes.includes(user.type_utilisateur)) {
      return true;
    }

    console.log("The page you requested is not accessible ! (Teacher guard)");
    //router.navigate(['/login']); // ou autre page
    return false;
  };
};

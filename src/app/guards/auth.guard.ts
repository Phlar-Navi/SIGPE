import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.is_Authenticated();
  if (!isAuthenticated) {
    console.log("The page you requested is not accessible ! (Auth guard)");
    router.navigate(['/login']);
    return false;
  }

  return true;

  // if (user) return true;

  // router.navigate(['/login']);
  // return false;
};

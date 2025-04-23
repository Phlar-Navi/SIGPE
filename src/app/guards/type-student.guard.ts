import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const typeStudentGuard = (allowedTypes: string[]): CanActivateFn => {
  return async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const userType = localStorage.getItem('user_type');

    const user = await authService.getUserData();
    console.log(userType);
    if (userType) {
      if (allowedTypes.includes(userType)) {
        return true;
      }
    }

    console.log("The page you requested is not accessible ! (Student guard)");
    router.navigate(['/login']); // ou autre page
    return false;
  };
};

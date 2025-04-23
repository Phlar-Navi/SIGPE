import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';

export const redirectIfAuthenticatedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const userType = localStorage.getItem('user_type');

  return authService.isReady$().pipe(
    tap(ready => console.log('isReady:', ready)),
    switchMap(() => authService.getUserObservable()),
    tap(user => {if (user){ console.log('User in guard? TRUE'); } else {console.log('User in guard: FALSE'); }}),
    switchMap(user => {
      if (user) {
        const redirectPath =
          userType === 'ENS' ? '/teacher-dashboard' :
          userType === 'ETU' ? '/student-dashboard' :
          '/admin-dashboard';

        console.log("User already logged in → redirecting to:", redirectPath);

        router.navigateByUrl(redirectPath);
        return of(false);
      }

      console.log("User not authenticated → access granted to login/register");
      return of(true);
    })
  );
};

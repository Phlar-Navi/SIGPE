import { Injectable } from '@angular/core';
import { 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpInterceptor, 
  HttpErrorResponse 
} from '@angular/common/http';
import { 
  BehaviorSubject, 
  Observable, 
  from, 
  throwError, 
  of 
} from 'rxjs';
import { 
  switchMap, 
  catchError, 
  filter, 
  take, 
  mergeMap 
} from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private storage: Storage,
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // URLs qui ne nécessitent PAS de token
    const publicUrls = [
      '/api/presences/filieres',
      '/api/presences/niveaux',
      '/api/presences/specialites',
      '/api/presences/matieres',
      '/api/presences/salles',
      'http://localhost:8000/api/loginAdmin'
    ];

    // Si la requête est vers une URL publique, on laisse passer sans token
    if (publicUrls.some(url => request.url.includes(url))) {
      return next.handle(request);
    }

    return from(this.storage.get('access_token')).pipe(
      switchMap((token) => {
        if (token) {
          request = this.addTokenHeader(request, token);
        }
        return next.handle(request).pipe(
          catchError((error) => {
            // if (error instanceof HttpErrorResponse && error.status === 401) {
            //   return this.handle401Error(request, next);
            // }
            return throwError(() => error);
          })
        );
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  //ATTENTION, CETTE METHODE EJECTE SOUVENT L'USER HORS DE L'APP (LE RENVOIE SUR LA PAGE DE LOGIN) SI IL NE TROUVE PAS DE REFRESH TOKEN

  // private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  //   if (!this.isRefreshing) {
  //     this.isRefreshing = true;
  //     this.refreshTokenSubject.next(null);

  //     return from(this.storage.get('refresh_token')).pipe(
  //       switchMap((refreshToken) => {
  //         if (!refreshToken) {
  //           this.authService.logout();
  //           this.router.navigate(['/login']);
  //           return throwError(() => new Error('No refresh token available'));
  //         }

  //         return from(this.authService.refreshToken()).pipe(
  //           switchMap((tokens: any) => {
  //             this.isRefreshing = false;
              
  //             return from(Promise.all([
  //               this.storage.set('access_token', tokens.access),
  //               tokens.refresh ? this.storage.set('refresh_token', tokens.refresh) : Promise.resolve()
  //             ])).pipe(
  //               switchMap(() => {
  //                 this.refreshTokenSubject.next(tokens.access);
  //                 return next.handle(this.addTokenHeader(request, tokens.access));
  //               })
  //             );
  //           }),
  //           catchError((err) => {
  //             this.isRefreshing = false;
  //             this.authService.logout();
  //             this.router.navigate(['/login']);
  //             return throwError(() => err);
  //           })
  //         );
  //       })
  //     );
  //   } else {
  //     return this.refreshTokenSubject.pipe(
  //       filter(token => token !== null),
  //       take(1),
  //       switchMap((token) => {
  //         return next.handle(this.addTokenHeader(request, token!));
  //       })
  //     );
  //   }
  // }
}
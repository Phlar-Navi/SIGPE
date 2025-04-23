import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Storage } from '@ionic/storage-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // Liste d'URLs (ou fragments) pour lesquelles on n'ajoute PAS le token
  private excludedUrls: string[] = [
    '/api/presences/filieres/',
    '/api/presences/niveaux/',
    '/api/presences/specialites/',
    '/api/auth/login/',
    '/api/auth/register/',
  ];

  constructor(private storage: Storage) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      this.storage.get('access_token').then(token => {
        // Vérifie si l’URL doit être exclue
        const shouldExclude = this.excludedUrls.some(url => request.url.includes(url));

        if (token && !shouldExclude) {
          const authReq = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          next.handle(authReq).subscribe(observer);
        } else {
          next.handle(request).subscribe(observer);
        }
      });
    });
  }

}

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // URLs qui ne nécessitent PAS de token
    const publicUrls = [
      '/api/presences/filieres',
      '/api/presences/niveaux',
      '/api/presences/specialites',
    ];

    // Si la requête est vers une URL publique, on laisse passer sans token
    if (publicUrls.some(url => request.url.includes(url))) {
      return next.handle(request);
    }

    // Pour les autres requêtes, on ajoute le token JWT
    const token = localStorage.getItem('access_token');
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}
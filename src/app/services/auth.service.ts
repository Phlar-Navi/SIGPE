import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular'
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt'; // Si tu utilises JWT

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth/';
  private isAuthenticated = new BehaviorSubject(false);
  private currentUserSubject = new BehaviorSubject<any>(null);
  private _storage: Storage | null = null;
  private isReady = new BehaviorSubject<boolean>(false); // attendre que le storage soit pret à aceuillir des valeures
  private userData = new BehaviorSubject<any>(null); // pour accéder depuis toutes les pages
  private jwtHelper = new JwtHelperService();



  constructor(private http: HttpClient, private storage: Storage) {
    // this.storage.create();
    this.init();
    this.loadUserFromStorage();
  }
  
  async init() {
    const storage = await this.storage.create();
    this._storage = storage;

    const user = await this._storage.get('user_data');
    if (user) this.userData.next(user);
    
    this.isReady.next(true); // Pour indiquer que le service est prêt
  }

  isReady$() {
    return this.isReady.asObservable();
  }

// Gestion des utilisateurs (Inscription et authentification et déconnexion) ---------
  register(userData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}register/`, userData, {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      }),
      observe: 'response' // Pour voir la réponse complète
    }).pipe(
      catchError(error => {
        console.error('Erreur complète:', error);
        if (error.error instanceof ErrorEvent) {
          // Erreur côté client
          console.error('Erreur client:', error.error.message);
        } else {
          // Erreur côté serveur
          console.error(`Code d'erreur: ${error.status}, corps: ${error.error}`);
        }
        return throwError(() => error);
      })
    );
  }
  
  login(credentials: {username: string, password: string}): Observable<any> {
    return new Observable(observer => {
      this.http.post<any>(`${this.apiUrl}login/`, credentials).subscribe({
        next: async (response) => {
          const { access, refresh, ...user } = response;

          // Stocker dans le storage
          await this._storage?.set('access_token', access);
          await this._storage?.set('refresh_token', refresh);
          await this._storage?.set('user_data', user);

          this.userData.next(user); // mise à jour des données en mémoire
          observer.next(user);
        },
        error: err => {
          observer.error(err);
        }
      });
    });
  }

  // login(credentials: {username: string, password: string}) {
  //   return this.http.post(`${this.apiUrl}login/`, credentials);
  // }

  async logout() {
    await this.storage?.clear();
    this.userData.next(null); // Réinitialiser les données utilisateur
    this.isAuthenticated.next(false); // Indiquer que l'utilisateur n'est plus authentifié
  }
  
// --------------------------------------------------------------------


// Gestion des tokens (Sauvegarde et Recupération) --------------------
  async saveTokens(access: string, refresh: string) {
    await this.storage.set('access_token', access);
    await this.storage.set('refresh_token', refresh);
    this.isAuthenticated.next(true);
  }
  async getAccessToken() {
    return this.storage.get('access_token');
  }
  async getRefreshToken() {
    return this.storage.get('refresh_token');
  }
// --------------------------------------------------------------------


  private async loadUserFromStorage() {
    const token = await this._storage?.get('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1])); // Décodage du token
      this.currentUserSubject.next(payload); // Mets à jour le sujet actuel de l'utilisateur
    }
  }


  // Vérifier si l'utilisateur est authentifié
  async is_Authenticated() {
    const token = await this._storage?.get('access_token');
    if (token) {
      // Vérification de la validité du token (par exemple, en vérifiant son expiration)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        return true; // Token valide
      }
    }
    return false; // Token invalide ou absent
  }

  getUserObservable() {
    return this.userData.asObservable();
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  async getUserData(): Promise<any> {
    const data = await this._storage?.get('user_data');
    if (!data){
      return null;
    }else {
      return data;
    }
  }
}
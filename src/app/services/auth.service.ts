import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular'
import { BehaviorSubject, catchError, lastValueFrom, Observable, throwError } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt'; // Si tu utilises JWT
import { ToastController } from '@ionic/angular';
import { Filiere, Salle, Niveau } from './session.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {from, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Specialite{
  id: string;
  nom: string;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //private apiUrl = 'http://localhost:8000/api/';
  private apiUrl = environment.apiUrl;
  private isAuthenticated_ = new BehaviorSubject(false);
  private currentUserSubject = new BehaviorSubject<any>(null);
  private _storage: Storage | null = null;
  private isReady = new BehaviorSubject<boolean>(false); // attendre que le storage soit pret à aceuillir des valeures
  private userData = new BehaviorSubject<any>(null); // pour accéder depuis toutes les pages
  private jwtHelper = new JwtHelperService();

  private currentUserSubject_profil = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject_profil.asObservable();

  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    USER_DATA: 'user_data',
    USER_TYPE: 'type_utilisateur'
  };

  constructor(private http: HttpClient, private storage: Storage, private toastController: ToastController, private router: Router) {
    // this.storage.create();
    this.init();
    this.loadUserFromStorage();
  }

  async initUserFromStorage() {
    const user = await this.storage.get(this.STORAGE_KEYS.USER_DATA);
    this.currentUserSubject_profil.next(user);
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    
    const token = await this._storage.get('access_token');
    const user = await this._storage.get('etudiant');
    
    if (token && user) {
      this.userData.next(user);
    }
    
    this.isReady.next(true);
  }
  
  // async init() {
  //   const storage = await this.storage.create();
  //   this._storage = storage;

  //   const user = await this._storage.get('user_data');
  //   if (user) this.userData.next(user);
    
  //   this.isReady.next(true); // Pour indiquer que le service est prêt
  // }

  isReady$() {
    return this.isReady.asObservable();
  }

  loadUserFromToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Exemple de structure à adapter selon ton backend
      const user = {
        username: payload.username,
        type_utilisateur: payload.type_utilisateur,
        // ...autres infos selon ton token
      };
  
      this.userData.next(user);
    }
  }
  

// Gestion des utilisateurs (Inscription et authentification et déconnexion) ---------
  register(userData: FormData): Observable<any> {
    return new Observable(observer => {
      this.http.post<any>(`${this.apiUrl}registerEtudiant/`, userData).subscribe({
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

  login(matricule: string, password: string, userType: string): Observable<any> {
    let url = `${this.apiUrl}loginAdmin/`;
    const email = matricule;
    // Définir les routes en fonction du type d'utilisateur
    if (userType === 'etudiant'){
      url = `${this.apiUrl}loginEtudiant/`;
    } else {
      if (userType === 'enseignant'){
        url = `${this.apiUrl}loginEnseignant/`;
      } else {
        url = `${this.apiUrl}loginAdmin/`;
      }
    }
    //// const url = userType === 'etudiant' ? `${this.apiUrl}loginEtudiant/` : `${this.apiUrl}loginEnseignant/`;

    if (userType != 'admin'){
      return this.http.post<any>(url, { matricule, password }).pipe(
        tap(async (response) => {
          // Appeler une méthode pour gérer la réponse
          await this.handleAuthResponse(response);
        }),
        catchError(error => {
          // Gestion des erreurs, si l'une des routes échoue
          this.clearAuthData();  // Nettoyer les données en cas d'erreur
          return throwError(() => error);
        })
      );
    } else {
      return this.http.post<any>(url, { email, password }).pipe(
        tap(async (response) => {
          // Appeler une méthode pour gérer la réponse
          await this.handleAuthResponse(response);
        }),
        catchError(error => {
          // Gestion des erreurs, si l'une des routes échoue
          this.clearAuthData();  // Nettoyer les données en cas d'erreur
          return throwError(() => error);
        })
      );
    }
  }

  // Fonction pour récupérer les informations utilisateur après la connexion
  private async handleAuthResponse(response: any): Promise<void> {
    // 1. Vérifiez que le token existe
    if (!response.access_token) {
      throw new Error('No access token in response');
    }

    //const accessToken = response.access_token;

    let userType = 'admin';
    if (response.etudiant) {
      userType = 'etudiant';
    } else if (response.enseignant) {
      userType = 'enseignant';
    } else if (response.admin) {
      userType = 'admin';
    }

    // Déterminer dynamiquement le type d'utilisateur et récupérer ses données
    //// const userType = response.etudiant ? 'etudiant' : 'enseignant';
    const userData = response[userType];

    await Promise.all([
      this.storage.set(this.STORAGE_KEYS.ACCESS_TOKEN, response.access_token),
      this.storage.set(this.STORAGE_KEYS.USER_DATA, userData),
      this.storage.set(this.STORAGE_KEYS.USER_TYPE, userType.toUpperCase())
    ]);

    this.userData.next(userData);

    const user = await this.storage.get(this.STORAGE_KEYS.USER_DATA);
    if (user && user.utilisateur) {
      this.redirectBasedOnUserType(user.utilisateur);
    }
  }

  async refreshUserData(): Promise<void> {
    const token = await this.storage.get(this.STORAGE_KEYS.ACCESS_TOKEN);
    const userType = await this.storage.get(this.STORAGE_KEYS.USER_TYPE);
    // console.log(userType, token);

    if (!token || !userType) {
      throw new Error('Token ou type utilisateur manquant');
    }

    let type = '';
    let endpoint = '';

    switch (userType.toUpperCase()) {
      case 'ETUDIANT':
        type = 'etudiant';
        endpoint = 'etudiant/me';
        break;
      case 'ENSEIGNANT':
        type = 'enseignant';
        endpoint = 'enseignant/me';
        break;
      case 'ADMIN':
        type = 'admin';
        endpoint = 'admin/me';
        break;
      default:
        throw new Error('Type d\'utilisateur invalide');
    }

    try {
      const response: any = await this.http.get(`${this.apiUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      }).toPromise();

      if (response && response[type]) {
        const userData = response[type];
        const accessToken = response.access_token || token;

        await Promise.all([
          this.storage.remove(this.STORAGE_KEYS.ACCESS_TOKEN),
          this.storage.remove(this.STORAGE_KEYS.USER_DATA),
          this.storage.remove(this.STORAGE_KEYS.USER_TYPE),
        ]);
        await Promise.all([
          this.storage.set(this.STORAGE_KEYS.ACCESS_TOKEN, accessToken),
          this.storage.set(this.STORAGE_KEYS.USER_DATA, userData),
          this.storage.set(this.STORAGE_KEYS.USER_TYPE, userType.toUpperCase())
        ]);
        
        this.currentUserSubject_profil.next(userData);
      } else {
        throw new Error('Données utilisateur non trouvées dans la réponse');
      }

    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur :', error);
    }
  }



  // async fetchUserProfileAfterUpdate(): Promise<void> {
  //   const token = await this.storage.get(this.STORAGE_KEYS.ACCESS_TOKEN);
  //   const userType = await this.storage.get(this.STORAGE_KEYS.USER_TYPE); // "ETUDIANT", "ENSEIGNANT", "ADMIN"

  //   const endpoint = {
  //     ETUDIANT: '/etudiant/me',
  //     ENSEIGNANT: '/enseignant/me',
  //     ADMIN: '/admin/me'
  //   }[userType];

  //   if (!endpoint) {
  //     throw new Error('Type d\'utilisateur inconnu');
  //   }

  //   const headers = new HttpHeaders({
  //     'Authorization': `Bearer ${token}`
  //   });

  //   this.http.get(`${this.apiUrl}${endpoint}`, { headers }).subscribe({
  //     next: async (response: any) => {
  //       let newUserData;
  //       if (response.etudiant) newUserData = response.etudiant;
  //       else if (response.enseignant) newUserData = response.enseignant;
  //       else if (response.admin) newUserData = response.admin;

  //       await Promise.all([
  //         this.storage.set(this.STORAGE_KEYS.USER_DATA, newUserData),
  //         this.userData.next(newUserData)
  //       ]);
  //     },
  //     error: err => {
  //       console.error('Erreur lors de la récupération des données utilisateur:', err);
  //     }
  //   });
  // }



  async getUsersId(){
    const user = await this.storage.get(this.STORAGE_KEYS.USER_DATA);
    if (user){
      return user.id;
    }
  }

  async getUsersType(){
    const user = await this.storage.get(this.STORAGE_KEYS.USER_DATA);
    if (user){
      return user.utilisateur;
    }
  }

    //Renvoyer l'user sur une page en fonction de son type
  private redirectBasedOnUserType(userType: string) {
    //this.router.navigate(['/student-dashboard']);
    switch(userType) {
      case 'ETU':
        this.router.navigate(['/student-dashboard']);
        break;
      case 'ENS':
        this.router.navigate(['/teacher-dashboard']);
        break;
      case 'ADM':
        this.router.navigate(['/admin-dashboard']);
        break; 
      default:
        this.router.navigate(['/']);
    }
  }


  // Fonction pour supprimer les données utilisateur et les tokens du stockage local
  private async clearAuthData(): Promise<void> {
    await Promise.all([
      this.storage.remove(this.STORAGE_KEYS.ACCESS_TOKEN),
      this.storage.remove(this.STORAGE_KEYS.USER_TYPE),
      this.storage.remove(this.STORAGE_KEYS.USER_DATA)
    ]);
    this.userData.next(null); // Réinitialisation des données utilisateur
  }

  // Fonction pour récupérer les données utilisateur depuis le stockage local
  async getUserData(): Promise<any> {
    const user = await this.storage.get(this.STORAGE_KEYS.USER_DATA);
    const userType = await this.storage.get(this.STORAGE_KEYS.USER_TYPE);

    if (user) {
      this.userData.next(user);
    } else {
      this.userData.next(null); // Réinitialiser si aucune donnée
    }

    return {
      ...user,
      userType: userType || null // Ajoute aussi le type d'utilisateur si besoin
    };
  }


  // Fonction pour obtenir l'utilisateur actuel depuis l'observable
  getUser(): Observable<any> {
    return this.userData.asObservable();
  }

  // Fonction pour vérifier si l'utilisateur est connecté
  async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.storage.get(this.STORAGE_KEYS.ACCESS_TOKEN);
    return !!accessToken;
  }

  // Fonction pour récupérer l'identifiant de l'utilisateur (et autres informations)
  async getUserId(): Promise<number | null> {
    const user = await this.storage.get(this.STORAGE_KEYS.USER_DATA);
    return user ? user.id : null;
  }

  // Gestion du refresh token
  // async refreshToken(): Promise<{ access: string, refresh?: string }> {
  //   // 1. Vérification du stockage prêt
  //   if (!this._storage) {
  //     throw new Error('Storage not initialized');
  //   }

  //   // 2. Récupération du refresh token
  //   const refreshToken = await this._storage.get(this.STORAGE_KEYS.REFRESH_TOKEN);
    
  //   if (!refreshToken) {
  //     await this.clearAuthData();
  //     throw new Error('Aucun refresh token disponible');
  //   }

  //   try {
  //     // 3. Appel au endpoint de refresh
  //     const response = await lastValueFrom(
  //       this.http.post<{ access: string, refresh?: string }>(
  //         `${this.apiUrl}token/refresh/`,
  //         { refresh: refreshToken }
  //       )
  //     );

  //     // 4. Stockage des nouveaux tokens
  //     await this._storage.set(this.STORAGE_KEYS.ACCESS_TOKEN, response.access);
      
  //     // Gestion du refresh token rotation (si le backend en renvoie un nouveau)
  //     if (response.refresh) {
  //       await this._storage.set(this.STORAGE_KEYS.REFRESH_TOKEN, response.refresh);
  //     }

  //     // 5. Mise à jour de l'état d'authentification
  //     this.isAuthenticated_.next(true);
      
  //     return response;

  //   } catch (error) {
  //     // 6. Gestion des erreurs
  //     console.error('Erreur de rafraîchissement du token:', error);
      
  //     // Si erreur 401 (refresh token invalide/expiré)
  //     if (error instanceof HttpErrorResponse && error.status === 401) {
  //       await this.clearAuthData();
  //       this.isAuthenticated_.next(false);
  //       this.userData.next(null);
  //     }

  //     throw error;
  //   }
  // }

  // login(credentials: {username: string, password: string}) {
  //   return this.http.post(`${this.apiUrl}login/`, credentials);
  // }

  async logout() {
    await this.storage?.clear();
    this.userData.next(null); // Réinitialiser les données utilisateur
    this.isAuthenticated_.next(false); // Indiquer que l'utilisateur n'est plus authentifié
  }
  
// --------------------------------------------------------------------


// Gestion des tokens (Sauvegarde et Recupération) --------------------
  async saveTokens(access: string, refresh: string) {
    await this.storage.set('access_token', access);
    await this.storage.set('refresh_token', refresh);
    this.isAuthenticated_.next(true);
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

  getUserObservable(): Observable<any> {
    return this.userData.asObservable();
  }

  // getUserObservable() {
  //   return this.userData.asObservable();
  // }

  // getCurrentUser() {
  //   return this.currentUserSubject.value;
  // }
  async getCurrentUser(): Promise<{id: number, [key: string]: any} | null> {
    try {
      const userData = await this._storage?.get(this.STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null; // Sérialisation/désérialisation si nécessaire
    } catch (error) {
      console.error('Erreur de lecture du storage', error);
      return null;
    }
  }

  async checkAuthAndGetUser(): Promise<{isAuthenticated: boolean, user: any}> {
    await this.init(); // S'assurer que le storage est initialisé
    const isAuth = await this.is_Authenticated();
    const user = await this.getUserData();
    return {isAuthenticated: isAuth, user};
  }

  // async getUserData(): Promise<any> {
  //   if (!this._storage) {
  //     await this.init(); // S'assurer que le storage est prêt
  //   }
  
  //   const data = await this._storage?.get('etudiant');
  //   console.log("[AuthService] getUserData() =>", data); // Vérifie les données récupérées
    
  //   return data ?? null;
  // }
  
  

  // LISTER TOUTES LES FILIERES, VUES, SPECIALITES DISPONIBLES -------------------------------
  
  getFilieres(): Observable<Filiere[]> {
    return this.http.get<Filiere[]>(`${this.apiUrl}/filieres/`);
  }
  
  getNiveaux(): Observable<Niveau[]> {
    return this.http.get<Niveau[]>(`${this.apiUrl}/niveaux/`);
  }
  
  getSpecialites(): Observable<Specialite[]> {
    return this.http.get<Specialite[]>(`${this.apiUrl}/specialites/`);
  }


  async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }
  
}
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

interface MetadataResponse {
  filieres: any[];
  niveaux: any[];
  specialites: any[];
}

export interface Matiere {
  id: number;
  nom: string;
  code: string;
  filiere_id: number;
  niveau_id: number;
  created_at: string;
  updated_at: string;
  pivot: {
    enseignant_id: number;
    matiere_id: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  // private baseUrl = environment.apiUrl;
  //private baseUrl = 'http://localhost:8000/api/';
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  updateEtudiant(id: string, formData: FormData, type: string): Observable<any> {
    if (type === "ETU"){
      return this.http.post(`${this.baseUrl}modifierEtudiant`, formData);
    } else {
      return this.http.post(`${this.baseUrl}modifierEnseignant`, formData);
    }
    
  }

  getMatieres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}matieres`);
  }

  getEnseignants(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}enseignants`);
  }

  updateDeviceToken(userId: number, token: string, type: string) {
    if (type === "ENS"){
      return this.http.post(`${this.baseUrl}enseignants/${userId}/device-token`, { device_token: token });
    } else {
      return this.http.post(`${this.baseUrl}etudiants/${userId}/device-token`, { device_token: token });
    }
  }




  // getFilieresPublic(): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/filieres/`, {
  //     headers: new HttpHeaders()  // Pas d'Authorization ici
  //   });
  // }
  getSalles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}salles/`);
  }

  getFilieres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}filiere/`);
  }

  // getFilieres(): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/api/presences/filieres/`);
  //   // http://localhost:8000/api/presences/filieres/
  // }

  // getNiveauxPublic(): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/niveaux/`, {
  //     headers: new HttpHeaders()  // Pas d'Authorization ici
  //   });
  // }

  // getNiveaux(): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/api/presences/niveaux/`);
  // }

  getNiveaux(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}niveaux/`);
  }

  // getSpecialites(): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/api/presences/specialites/`);
  // }
  // getSpecialites(): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.baseUrl}/specialites/`);
  // }

  // getSpecialitesPublic(): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/specialites/`, {
  //     headers: new HttpHeaders()  // Pas d'Authorization ici
  //   });
  // }

  // getAllMetadata(): Observable<any> {
  //   return forkJoin({
  //     filieres: this.getFilieresPublic(),
  //     niveaux: this.getNiveauxPublic(),
  //     specialites: this.getSpecialitesPublic()
  //   });
  // }
  // getCourseMetadata(filiere: number, niveau: number): Observable<{
  //   matieres_by_fil_niv: Matiere[];
  //   enseignants: Enseignant[];
  //   salles: any[];
  // }> {
  //   return forkJoin({
  //     matieres_by_fil_niv: this.getMatieresByFiliereAndNiveau(niveau, filiere),
  //     enseignants: this.getEnseignantByFiliereAndNiveau(niveau, filiere),
  //     salles: this.getSalles()
  //   });
  // }

  getAllMetadata(): Observable<{
    filieres: any[];
    niveaux: any[];
    salles: any[];
    //specialites: any[];
  }> {
    return forkJoin({
      filieres: this.getFilieres(),
      niveaux: this.getNiveaux(),
      salles: this.getSalles()
      //specialites: this.getSpecialites()
    });
  }
  
}

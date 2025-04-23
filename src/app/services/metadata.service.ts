import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { environment } from 'src/environments/environment';

interface MetadataResponse {
  filieres: any[];
  niveaux: any[];
  specialites: any[];
}

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  // private baseUrl = environment.apiUrl;
  private baseUrl = 'http://localhost:8000/api/presences';

  constructor(private http: HttpClient) { }

  getFilieresPublic(): Observable<any> {
    return this.http.get(`${this.baseUrl}/filieres/`, {
      headers: new HttpHeaders()  // Pas d'Authorization ici
    });
  }
  getFilieres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/filieres/`);
  }

  // getFilieres(): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/api/presences/filieres/`);
  //   // http://localhost:8000/api/presences/filieres/
  // }

  getNiveauxPublic(): Observable<any> {
    return this.http.get(`${this.baseUrl}/niveaux/`, {
      headers: new HttpHeaders()  // Pas d'Authorization ici
    });
  }

  // getNiveaux(): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/api/presences/niveaux/`);
  // }

  getNiveaux(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/niveaux/`);
  }

  // getSpecialites(): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/api/presences/specialites/`);
  // }
  getSpecialites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/specialites/`);
  }

  getSpecialitesPublic(): Observable<any> {
    return this.http.get(`${this.baseUrl}/specialites/`, {
      headers: new HttpHeaders()  // Pas d'Authorization ici
    });
  }

  // getAllMetadata(): Observable<any> {
  //   return forkJoin({
  //     filieres: this.getFilieresPublic(),
  //     niveaux: this.getNiveauxPublic(),
  //     specialites: this.getSpecialitesPublic()
  //   });
  // }

  getAllMetadata(): Observable<{
    filieres: any[];
    niveaux: any[];
    specialites: any[];
  }> {
    return forkJoin({
      filieres: this.getFilieres(),
      niveaux: this.getNiveaux(),
      specialites: this.getSpecialites()
    });
  }
  
}

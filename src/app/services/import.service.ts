import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private apiBaseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  importExcel(file: File, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('type', type);

    const endpointMap: {[key: string]: string} = {
      'etudiant': '/EtudiantsImport',
      'enseignant': '/EnseignantsImport',
      'salle': '/SalleImport',
      'matiere': '/MatiereImport',
      'niveau': '/NiveauImport',
      'filiere': '/FiliereImport'
    };

    const endpoint = endpointMap[type.toLowerCase()] || '/import-default';
    return this.http.post(`${this.apiBaseUrl}${endpoint}`, formData);
  }
}

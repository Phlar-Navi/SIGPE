import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JustificatifService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAbsencesEtudiant(etudiantId: number) {
    return this.http.post(`${this.apiUrl}ListeDesSessionsManquerParEtudiant/${etudiantId}`, {});
  }

  getJustificatifsEtudiant(): Observable<any> {
    return this.http.get(`${this.apiUrl}justificatifs/etudiant`);
  }

  creerJustificatif(data: any) {
    const formData = new FormData();
    formData.append('message', data.message);
    formData.append('presence_id', data.presence_id);
    formData.append('matiere_id', data.matiere_id);
    formData.append('enseignant_id', data.enseignant_id);
    formData.append('etudiant_id', data.etudiant_id);
    if (data.piece_jointe) {
      formData.append('piece_jointe', data.piece_jointe);
    }
    return this.http.post(`${this.apiUrl}CreationDeJustificatif`, formData);
  }

  getJustificatifsEnseignant(enseignantId: number) {
    return this.http.post(`${this.apiUrl}ListerLesJustificatifsParEnseignant/${enseignantId}`, {});
  }

  deleteJustificatif(id: number) {
    return this.http.delete(`${this.apiUrl}justificatifs/${id}`, {});
  }

  repondreJustificatif(id: number, decision: string, reponse: string) {
    return this.http.patch(`${this.apiUrl}justificatifs/${id}/reponse`, {
      statut: decision,
      reponse_enseignant: reponse
    });
  }

  modifierJustificatif(id: number, data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}justificatifs/${id}/modifier`, data);
  }


}

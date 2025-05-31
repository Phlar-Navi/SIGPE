// admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAttendanceStats(params: any): Observable<any> {
    let httpParams = new HttpParams()
      .set('start_date', params.start_date)
      .set('end_date', params.end_date);

    if (params.enseignant_id) httpParams = httpParams.set('enseignant_id', params.enseignant_id);
    if (params.etudiant_id) httpParams = httpParams.set('etudiant_id', params.etudiant_id);
    if (params.salle_id) httpParams = httpParams.set('salle_id', params.salle_id);
    if (params.filiere_id) httpParams = httpParams.set('filiere_id', params.filiere_id);
    if (params.niveau_id) httpParams = httpParams.set('niveau_id', params.niveau_id);

    return this.http.get(`${this.apiUrl}presence/stats`, { params: httpParams });
  }
  
  getUserActivity(type: 'enseignant' | 'etudiant') {
    return this.http.get<any[]>(`${this.apiUrl}${type}s/activities`);
  }

  // CRUD Générique
  getItems(model: string, page = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}admin/${model}?page=${page}`);
  }

  getAllTeachers(): Observable<any> {
    return this.http.get(`${this.apiUrl}enseignant`);
  }

  createItem(model: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}admin/${model}`, data);
  }

  updateItem(model: string, id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}admin/${model}/${id}`, data);
  }

  deleteItem(model: string, id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}admin/${model}/${id}`);
  }

  // Relations enseignant
  linkTeacherToEntities(teacherId: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}admin/enseignants/${teacherId}/link-entities`, data);
  }

  getTeacherRelations(teacherId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}admin/enseignants/${teacherId}`);
  }
}
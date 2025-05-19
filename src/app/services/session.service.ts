import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
// import { Session } from '../components/session-list/session-list.component';
import { Session_format } from '../pages/teacher/teacher-course/teacher-course.page';
import { Session_Laravel } from '../pages/teacher/teacher-course/teacher-course.page';
import { Storage } from '@ionic/storage-angular';

export interface Matiere {
  id: number;
  nom: string;
  code: string;
  enseignant: string;
}
export interface Salle {
  id: number;
  nom: string;
  latitude: number;
  longitude: number;
  rayon: number;
}
export interface Niveau {
  id: number;
  nom: string;
  code: string;
}
export interface Filiere {
  id: number;
  nom: string;
  code: string;
}
export interface SessionCours {
  id: number;
  matiere: string;
  salle: string;
  niveau: number;
  filiere: string;
  etat: string;
  heure_debut: Date;
  duree: number;
  liste_presence: number[];
}

export interface Enseignant{
  id: number;
  nom: string;
  prenom: string;
  //photo: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://localhost:8000/api/'; // ajuste l'URL si besoin
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    USER_DATA: 'user_data',
    USER_TYPE: 'type_utilisateur'
  };

  constructor(private http: HttpClient, private storage: Storage) { }

  getAllMatieres(): Observable<Matiere[]> {
    return this.http.get<Matiere[]>(`${this.apiUrl}matieres`);
  }

  async loadCourseData(): Promise<any[]> {
    await this.storage.create();
    const user = await this.storage.get(this.STORAGE_KEYS.USER_DATA);
    const typeUtilisateur = user.utilisateur;
    const userId = user.id;
    //console.log(user);
  
    return new Promise(async (resolve, reject) => {
      if (typeUtilisateur === 'ENS') {
        this.getSessionsByEnseignant(userId).subscribe(
          (sessions) => resolve(sessions),
          (error) => {
            console.error('Erreur récupération sessions enseignant', error);
            reject(error);
          }
        );
      } else if (typeUtilisateur === 'ETU') {
        const filiere = user.filiere_id;
        const niveau = user.niveau_id;

        if (niveau && filiere) {
          this.getSessionsByNiveauAndFiliere(niveau, filiere).subscribe(
            (sessions) => resolve(sessions),
            (error) => {
              console.error('Erreur récupération sessions étudiant', error);
              reject(error);
            }
          );
        } else {
          console.warn('Niveau ou filière manquant pour l’étudiant');
          reject('Niveau ou filière manquant');
        }
      } else {
        reject('Type utilisateur inconnu');
      }
    });
  }

  getSessionsByEnseignant(enseignantId: number): Observable<Session_Laravel[]> {
    return this.http.post<Session_Laravel[]>(`${this.apiUrl}sessionsParEnseignant/${enseignantId}`, {});
  }

  getSessionsByNiveauAndFiliere(niveau: number, filiere: number): Observable<Session_Laravel[]> {
    return this.http.post<Session_Laravel[]>(`${this.apiUrl}sessionsParFiliereEtNiveau`, {
      niveau_id: niveau,
      filiere_id: filiere
    }).pipe(
      map((apiSessions: any[]) =>
        apiSessions.map(session => {
          const startDate = new Date(session.heure_debut);
          const endDate = new Date(startDate.getTime() + (session.duree_minutes ?? 120) * 60000); // 120 par défaut

          return {
            id: session.id,
            statut: session.statut,
            heure_debut: session.heure_debut,
            heure_fin: session.heure_fin,
            lien: session.lien ?? null,
            description: session.description ?? null,

            salle_id: session.salle_id ?? null,
            matiere_id: session.matiere_id,
            filiere_id: session.filiere_id,
            niveau_id: session.niveau_id,

            created_at: session.created_at,
            updated_at: session.updated_at,

            matiere: session.matiere ? {
              id: session.matiere.id,
              code: session.matiere.code,
              nom: session.matiere.nom
            } : undefined,

            salle: session.salle ? {
              id: session.salle.id,
              nom: session.salle.nom,
              latitude: session.salle.latitude,
              longitude: session.salle.longitude,
              rayon_metres: session.salle.rayon_metres
            } : undefined,

            enseignant: session.enseignant ? {
              id: session.enseignant.id,
              nom: session.enseignant.nom,
              prenom: session.enseignant.prenom
            } : undefined,

            niveau: session.niveau ? {
              id: session.niveau.id,
              nom: session.niveau.nom
            } : undefined,

            filiere: session.filiere ? {
              id: session.filiere.id,
              nom: session.filiere.nom
            } : undefined
          } as Session_Laravel;
        })
      )
    );
  }

  deleteSession(sessionId: number){
    return this.http.delete(`${this.apiUrl}sessions/${sessionId}`);
  }

  // getMatieresByEnseignantAndFilters(
  //     niveauId: number,
  //     filiereId: number
  //   ): Observable<{ sessions: Session_Laravel[] }> {
  //     return this.http.post<{ sessions: Session_Laravel[] }>(
  //       `${this.apiUrl}sessionsParFiliereEtNiveau/`,
  //       {
  //         filiere: filiereId,
  //         niveau: niveauId
  //       }
  //     );
  //   }

  getMatieresByEnseignant(enseignantId: number): Observable<Matiere[]> {
    return this.http.post<{ sessions: Matiere[] }>(
      `${this.apiUrl}getMatieresByEnseignant/${enseignantId}`,
      {}
    ).pipe(
      map(response => response.sessions)  // On extrait uniquement la liste de matières
    );
  }
 

  getSalles(): Observable<Salle[]> {
    return this.http.get<Salle[]>(`${this.apiUrl}/salles/`);
  }

  getFilieres(): Observable<Filiere[]> {
    return this.http.get<Filiere[]>(`${this.apiUrl}/filieres/`);
  }

  getNiveaux(): Observable<Niveau[]> {
    return this.http.get<Niveau[]>(`${this.apiUrl}/niveaux/`);
  }

  createSession(sessionData: Session_format): Observable<Session_Laravel> {
    return this.http.post<Session_Laravel>(`${this.apiUrl}addsession`, sessionData);
  }

  createSession_format(sessionData: any): Observable<Session_format> {
    return this.http.post<Session_format>(`${this.apiUrl}/sessions/`, sessionData);
  }

  getMatieresByEnseignantAndFilters(
    enseignantId: number,
    niveauId: number,
    filiereId: number
  ): Observable<Matiere[]> {
    return this.http
      .post<{ matieres: Matiere[] }>(
        `${this.apiUrl}getMatieresByEnseignantFiliereAndNiveau/${enseignantId}`,
        {
          filiere: filiereId,
          niveau: niveauId
        }
      )
      .pipe(map(response => response.matieres));
  }

  getMatieresByFiliereAndNiveau(
    niveauId: number,
    filiereId: number
  ): Observable<Matiere[]> {
    return this.http
      .post<{ matieres: Matiere[] }>(
        `${this.apiUrl}matieres/byfiliereniveau/`,
        {
          filiere: filiereId,
          niveau: niveauId
        }
      )
      .pipe(map(response => response.matieres));
  }

  getEnseignantByFiliereAndNiveau(
    niveauId: number,
    filiereId: number
  ): Observable<Enseignant[]> {
    return this.http
      .post<{ enseignant: Enseignant[] }>(
        `${this.apiUrl}enseignants/byfiliereniveau/`,
        {
          filiere: filiereId,
          niveau: niveauId
        }
      )
      .pipe(map(response => response.enseignant));
  }
}

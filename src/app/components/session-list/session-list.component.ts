import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from 'src/app/services/session.service';
import { Session_Laravel } from 'src/app/pages/teacher/teacher-course/teacher-course.page';
import { MetadataService } from 'src/app/services/metadata.service';
import { LoadingController } from '@ionic/angular';
import { Subject, Subscription } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SessionEventService } from 'src/app/services/session-event.service';

@Component({
  selector: 'app-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class SessionListComponent implements OnInit, OnDestroy {
  @Input() userRole: 'etudiant' | 'enseignant' = 'enseignant';
  @Input() filiereId?: number;
  @Input() niveauId?: number;
  @Input() enseignantId?: number;

  @Output() sessionSelected = new EventEmitter<Session_Laravel>();
  @Output() sessionsLoaded = new EventEmitter<Session_Laravel[]>();
  private sessionCreatedSub?: Subscription;

  sessions: Session_Laravel[] | null = null;

  originalSessions: Session_Laravel[] = [];
  selectedStatut: string = 'À venir';
  selectedPeriod: string = 'jour';

  private refreshTrigger$ = new Subject<void>();

  constructor(private sessionService: SessionService, 
    private loadingController: LoadingController,
    private sessionEventService: SessionEventService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['filiereId'] || 
      changes['niveauId'] || 
      changes['enseignantId'] || 
      changes['userRole']
    ) {
      this.refreshCourseData();
    }
  }
  
  ngOnInit() {
    this.refreshTrigger$.subscribe(() => {
      this.refreshCourseData(); // ta méthode de chargement
    });

    this.refreshCourseData();

    // 🔁 Abonnement à l'événement de création
    this.sessionCreatedSub = this.sessionService.sessionCreated$.subscribe(() => {
      console.log('[SessionListComponent] Événement reçu : on refresh');
      this.refreshCourseData();
    });

    this.sessionEventService.refreshTrigger$.subscribe(() => {
      this.refreshCourseData();
    });
  }

  ngOnDestroy() {
    this.sessionCreatedSub?.unsubscribe();
  }

  public async refreshCourseData() {
    this.sessions = null;
    if (this.userRole === 'etudiant') {
      console.log("C'est ceci qui recharge auto chez les etudiants");
      if (!this.filiereId || !this.niveauId) {
        console.error('Filiere et Niveau requis pour étudiant');
        return;
      }
      this.sessionService.getSessionsByNiveauAndFiliere(this.niveauId, this.filiereId)
        .subscribe(sessions => {
          //this.sessions = sessions;
          this.originalSessions = sessions;
          this.applyFilters(); // au lieu de simplement this.sessions = sessions;
          this.sessionsLoaded.emit(sessions);
        }, err => {
          console.error('Erreur chargement sessions par filière et niveau', err);
        });
    } 
    else if (this.userRole === 'enseignant') {
      console.log("C'est ceci qui recharge auto chez les enseignants");
      if (!this.enseignantId) {
        //console.error('Enseignant ID requis pour enseignant');
        return;
      }
      this.sessionService.getSessionsByEnseignant(this.enseignantId)
        .subscribe(sessions => {
          //this.sessions = sessions;
          this.originalSessions = sessions;
          this.applyFilters(); // au lieu de simplement this.sessions = sessions;
          this.sessionsLoaded.emit(sessions);
        }, err => {
          console.error('Erreur chargement sessions par enseignant', err);
        });
    }
  }

  applyFilters() {
    if (!this.originalSessions) return;

    const today = new Date();
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
    startOfWeek.setHours(0, 0, 0, 0); // début du jour

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche
    endOfWeek.setHours(23, 59, 59, 999); // fin du jour

    this.sessions = this.originalSessions.filter(session => {
      let matchStatut = true;
      let matchPeriod = true;

      if (this.selectedStatut) {
        matchStatut = session.statut === this.selectedStatut;
      }

      if (this.selectedPeriod) {
        const sessionDate = new Date(session.heure_debut);
        sessionDate.setHours(0, 0, 0, 0); // on compare uniquement les dates

        if (this.selectedPeriod === 'jour') {
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          matchPeriod = sessionDate.getTime() === todayDate.getTime();
        } else if (this.selectedPeriod === 'semaine') {
          matchPeriod = sessionDate >= startOfWeek && sessionDate <= endOfWeek;
        }
      }

      return matchStatut && matchPeriod;
    });
  }


  // applyFilters() {
  //   if (!this.originalSessions) return;

  //   const today = new Date();
  //   const startOfWeek = new Date(today);
  //   startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
  //   const endOfWeek = new Date(startOfWeek);
  //   endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche

  //   this.sessions = this.originalSessions.filter(session => {
  //     let matchStatut = true;
  //     let matchPeriod = true;

  //     if (this.selectedStatut) {
  //       matchStatut = session.statut === this.selectedStatut;
  //     }

  //     if (this.selectedPeriod) {
  //       const sessionDate = new Date(session.heure_debut);
  //       sessionDate.setHours(0, 0, 0, 0); // pour ignorer l'heure

  //       if (this.selectedPeriod === 'jour') {
  //         const todayDate = new Date();
  //         todayDate.setHours(0, 0, 0, 0);
  //         matchPeriod = sessionDate.getTime() === todayDate.getTime();
  //       } else if (this.selectedPeriod === 'semaine') {
  //         matchPeriod = sessionDate >= startOfWeek && sessionDate <= endOfWeek;
  //       }
  //     }

  //     return matchStatut && matchPeriod;
  //   });
  // }


  selectSession(session: Session_Laravel) {
    this.sessionSelected.emit(session);
  }

  getSessionClass(status: string): string {
    switch (status) {
      case 'À venir': return 'bg-gradient-to-b from-green-50 to-green-100 border-b-4 border-green-600';
      case 'En cours': return 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-b-4 border-yellow-600';
      case 'Terminé': return 'bg-gradient-to-b from-red-50 to-red-100 border-b-4 border-red-600';
      default: return 'bg-gray-50 border-b-4 border-gray-600';
    }
  }

  getIconClass(status: string): string {
    return {
      'À venir': 'bg-green-600',
      'En cours': 'bg-yellow-600',
      'Terminé': 'bg-red-600'
    }[status] ?? 'bg-gray-600';
  }

  getIcon(status: string): string {
    return {
      'À venir': 'fas fa-calendar-alt',
      'En cours': 'fas fa-chalkboard-teacher',
      'Terminé': 'fas fa-check-circle'
    }[status] ?? 'fas fa-question-circle';
  }

  getStatusClass(status: string): string {
    return {
      'À venir': 'text-green-700',
      'En cours': 'text-yellow-700',
      'Terminé': 'text-red-700'
    }[status] ?? 'text-gray-700';
  }
}

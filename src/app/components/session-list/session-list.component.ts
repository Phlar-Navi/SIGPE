import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from 'src/app/services/session.service';
import { Session_Laravel } from 'src/app/pages/teacher/teacher-course/teacher-course.page';
import { MetadataService } from 'src/app/services/metadata.service';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SessionListComponent implements OnInit {
  @Input() userRole: 'etudiant' | 'enseignant' = 'enseignant';
  @Input() filiereId?: number;
  @Input() niveauId?: number;
  @Input() enseignantId?: number;

  @Output() sessionSelected = new EventEmitter<Session_Laravel>();
  @Output() sessionsLoaded = new EventEmitter<Session_Laravel[]>();

  sessions: Session_Laravel[] = [];

  constructor(private sessionService: SessionService, private loadingController: LoadingController) {}

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
    this.refreshCourseData();
    //console.log(this.filiereId, this.niveauId);
  }

  async refreshCourseData() {
    // const loading = await this.loadingController.create({
    //   message: 'Création de la session...',
    //   spinner: 'bubbles',
    //   backdropDismiss: false
    // });
    // await loading.present();

    if (this.userRole === 'etudiant') {
      if (!this.filiereId || !this.niveauId) {
        console.error('Filiere et Niveau requis pour étudiant');
        return;
      }
      this.sessionService.getSessionsByNiveauAndFiliere(this.niveauId, this.filiereId)
        .subscribe(sessions => {
          this.sessions = sessions;
          this.sessionsLoaded.emit(sessions);
        }, err => {
          console.error('Erreur chargement sessions par filière et niveau', err);
        });
    } 
    else if (this.userRole === 'enseignant') {
      if (!this.enseignantId) {
        //console.error('Enseignant ID requis pour enseignant');
        return;
      }
      this.sessionService.getSessionsByEnseignant(this.enseignantId)
        .subscribe(sessions => {
          this.sessions = sessions;
          this.sessionsLoaded.emit(sessions);
        }, err => {
          console.error('Erreur chargement sessions par enseignant', err);
        });
    }
  }

  selectSession(session: Session_Laravel) {
    this.sessionSelected.emit(session);
  }

  getSessionClass(status: string): string {
    switch (status) {
      case 'À venir': return 'bg-gradient-to-b from-green-50 to-green-100 border-b-4 border-green-600';
      case 'En cours': return 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-b-4 border-yellow-600';
      case 'Terminée': return 'bg-gradient-to-b from-red-50 to-red-100 border-b-4 border-red-600';
      default: return 'bg-gray-50 border-b-4 border-gray-600';
    }
  }

  getIconClass(status: string): string {
    return {
      'À venir': 'bg-green-600',
      'En cours': 'bg-yellow-600',
      'Terminée': 'bg-red-600'
    }[status] ?? 'bg-gray-600';
  }

  getIcon(status: string): string {
    return {
      'À venir': 'fas fa-calendar-alt',
      'En cours': 'fas fa-chalkboard-teacher',
      'Terminée': 'fas fa-check-circle'
    }[status] ?? 'fas fa-question-circle';
  }

  getStatusClass(status: string): string {
    return {
      'À venir': 'text-green-700',
      'En cours': 'text-yellow-700',
      'Terminée': 'text-red-700'
    }[status] ?? 'text-gray-700';
  }
}

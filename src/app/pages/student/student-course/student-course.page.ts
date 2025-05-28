import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
// import { Session } from 'src/app/components/session-list/session-list.component';
import { Session_Laravel } from '../../teacher/teacher-course/teacher-course.page';
import { Storage } from '@ionic/storage-angular';
import { SessionListComponent } from 'src/app/components/session-list/session-list.component';
import { Subscription } from 'rxjs';
import { SessionService } from 'src/app/services/session.service';
import { SessionDetailsComponent } from 'src/app/components/session-details/session-details.component';

export interface Student {
  nom: string;
  id: number;
}
@Component({
  selector: 'app-student-course',
  templateUrl: './student-course.page.html',
  styleUrls: ['./student-course.page.scss'],
  standalone: false
})
export class StudentCoursePage implements OnInit, OnDestroy {
  @ViewChild(SessionListComponent) sessionListComponent!: SessionListComponent;
  @ViewChild(SessionDetailsComponent) sessionDetailsComponent!: SessionDetailsComponent;
  private sessionCreatedSub!: Subscription;
  
  showStats: boolean = true;
  //selectedSession: number = 0;
  showAttendance: boolean = true;
  showCreateSession = false;
  isSmallScreen = false;
  isMenuOpen = false; // État du menu (ouvert/fermé)
  sessions: Session_Laravel[] | null = [];
  // {
  //     // date: '2023-10-10, 10:00',
  //     // date_fin: '2023-10-10, 12:00',
  //     // description:"",
  //     // teacher: 'Dr. Moskolai',
  //     // students: [],
  //     // date_debut: "",
  //     id: "1",
  //     filiere: 'Mathématiques',
  //     salle: 'A101',
  //     status: 'a_venir',
  //     matiere: "",
  //     niveau: "L1",
  //     duree_minutes: 60,
  //     heure_debut: ""
  //   },
  //   {
  //     id: "2",
  //     filiere: 'Informatique',
  //     salle: 'B202',
  //     status: 'en_cours',
  //     matiere: "",
  //     niveau: "L1",
  //     duree_minutes: 60,
  //     heure_debut: ""
  //   },
  //   {
  //     id: "3",
  //     filiere: 'Physique',
  //     salle: 'C303',
  //     status: 'termine',
  //     matiere: "",
  //     niveau: "L1",
  //     duree_minutes: 60,
  //     heure_debut: ""
  //   },
  selectedSession: Session_Laravel | null = null; // Variable pour stocker la session sélectionnée
  studentList: Student[] = [];
  filiere_id!: number;
  niveau_id!: number;
  userRole: 'etudiant' | 'enseignant' = 'etudiant';

   private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    USER_DATA: 'user_data',
    USER_TYPE: 'type_utilisateur'
  };


  constructor(private storage: Storage, private sessionService: SessionService) { }

  async ngOnInit() {
    this.generate_charts();
    this.studentList = [
      { id: 1, nom: 'Ken' },
      { id: 2, nom: 'Divine' },
    ];
    const user = await this.storage.get(this.STORAGE_KEYS.USER_DATA);
    this.filiere_id = user.filiere_id;
    this.niveau_id = user.niveau_id;

    this.sessionService.sessionUpdated$.subscribe(() => {
      console.log("Mise à jour détectée depuis teacher page !");
      if (this.sessionDetailsComponent && this.selectedSession) {
        this.sessionDetailsComponent.loadList(this.selectedSession);
      }
    });

    this.sessionCreatedSub = this.sessionService.sessionCreated$.subscribe(() => {
      //console.log('Rafraîchissement déclenché depuis student-page');
      this.forceRefresh();
    });
  }

  private forceRefresh() {
    // Réinitialise les données pour forcer le refresh
    this.sessions = null;
    
    if (this.sessionListComponent) {
      this.sessionListComponent.refreshCourseData();
    } else {
      // Fallback si le composant enfant n'est pas encore chargé
      setTimeout(() => {
        if (this.sessionListComponent) {
          this.sessionListComponent.refreshCourseData();
        }
      }, 500);
    }
  }

  ngOnDestroy(): void {
    if (this.sessionCreatedSub) {
      this.sessionCreatedSub.unsubscribe();
    }
  }

  onSessionsLoaded(loadedSessions: Session_Laravel[]) {
    this.sessions = loadedSessions;
  }

  onSessionSelected(session: Session_Laravel) {
    this.selectedSession = session;
    // this.selectedSession = this.sessions.find((session) => session.id === sessionId) || null;
  }

  viewStudentProfile(value: number){}

  generate_charts(){
      // Données de présence
      const presenceData = {
        labels: ["Présents", "Absents"],
        datasets: [{
          data: [80, 20],
          backgroundColor: ["#10B981", "#EF4444"],
        }],
      };
  
      // Graphique en courbes
      const canvasElement2 = document.getElementById(`sessionStatsChart`);
  
      if(canvasElement2){
        const ctx = (canvasElement2 as HTMLCanvasElement).getContext('2d');
        if(ctx){
          new Chart(ctx, {
            type: "pie",
            data: presenceData,
            options: {
              animation: {
                duration: 1000,
              },
            },
          });
        }
      }
  
    }

  ngAfterViewInit() {
    // Patiente un peu pour laisser Angular appliquer les @Input()
    setTimeout(() => {
      this.sessionListComponent?.refreshCourseData();
      // if (this.sessionListComponent) {
      //   this.sessionListComponent.refreshCourseData();
      // }
    }, 0);
  }


}

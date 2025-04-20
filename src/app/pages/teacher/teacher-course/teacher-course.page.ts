import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Chart } from 'chart.js/auto';
import { Session } from 'src/app/components/session-list/session-list.component';

@Component({
  selector: 'app-teacher-course',
  templateUrl: './teacher-course.page.html',
  styleUrls: ['./teacher-course.page.scss'],
  standalone: false
})
export class TeacherCoursePage implements OnInit {
  showStats: boolean = false;
  //selectedSession: number = 0;
  showAttendance: boolean = true;
  showCreateSession = false; // Contrôle l'affichage du formulaire
  isMenuOpen = false; // État du menu (ouvert/fermé)
  isSmallScreen = false; 
  // sessions: Session[] = [
  //   {
  //     id: 1,
  //     title: 'Mathématiques',
  //     date: '2023-10-10, 10:00 - 12:00',
  //     room: 'A101',
  //     description:"",
  //     teacher: 'Dr. Moskolai',
  //     status: 'À venir',
  //     students: [
  //       {}
  //     ]
  //   },
  //   {
  //     id: 2,
  //     title: 'Informatique',
  //     date: '2023-10-11, 14:00 - 16:00',
  //     room: 'B202',
  //     description:"",
  //     teacher: 'Dr. Smith',
  //     status: 'En cours',
  //     students: [
  //       {}
  //     ]
  //   },
  //   {
  //     id: 3,
  //     title: 'Physique',
  //     date: '2023-10-09, 08:00 - 10:00',
  //     room: 'C303',
  //     description:"",
  //     teacher: 'Dr. Dupont',
  //     status: 'Terminée',
  //     students: [
  //       {}
  //     ]
  //   },
  // ];
  selectedSession: Session | null = null; // Variable pour stocker la session sélectionnée
  chart: any;
  //showAttendance = false; // Contrôle l'affichage de la modalité
  newStudent = { name: '', matricule: '' }; // Stocke les données du formulaire
  manualAttendanceList: { name: string; matricule: string }[] = []; // Liste des étudiants ajoutés manuellement
  isSessionOn: boolean = false;
  sessions: Session[] = []; // Liste des sessions existantes
  newSession: Omit<Session, 'id' | 'status' | 'teacher' | 'students'> = {
    title: '',
    date: '',
    date_fin: '',
    room: '',
    description: '',
  };
  isStartTimeInvalid = false;

  constructor(private loadingController: LoadingController) { }

  // Soumission du formulaire
  async onSubmit() {
    const UNE_HEURE_MS = 60 * 60 * 1000;
  
    const sessionStartTime = new Date(this.newSession.date);
    const sessionEndTime = new Date(this.newSession.date_fin);
    const DateNow = new Date();
    const dateMoinsUneMinute = new Date(DateNow.getTime() - 60 * 1000);
  
    // Vérifier si l'heure de début est valide
    if (sessionStartTime < dateMoinsUneMinute) {
      alert('Le cours programmé ne peut se dérouler avant l\'heure actuelle...');
      return;
    }
  
    // Vérifier que la session dure au moins une heure
    if ((sessionEndTime.getTime() - sessionStartTime.getTime()) < UNE_HEURE_MS) {
      alert('Un cours doit durer au moins une heure.');
      return;
    }
  
    // Vérifier les chevauchements avec les autres sessions
    const hasTimeOverlap = this.sessions.some((session) => {
      const existingStart = new Date(session.date).getTime();
      const existingEnd = new Date(session.date_fin).getTime();
  
      // Le nouveau cours commence avant la fin d’un cours existant
      // ET se termine après le début du cours existant
      return (
        sessionStartTime.getTime() < existingEnd &&
        sessionEndTime.getTime() > existingStart
      );
    });
  
    if (hasTimeOverlap) {
      alert('Conflit d\'horaire : Le nouveau cours chevauche une session existante.');
      return;
    }
  
    // Vérifier s’il y a déjà un cours exactement au même moment et dans la même salle
    const hasConflict = this.sessions.some((session) => {
      const existingStart = new Date(session.date);
      return (
        existingStart.toISOString() === sessionStartTime.toISOString() &&
        session.room === this.newSession.room
      );
    });
  
    if (hasConflict) {
      alert('Conflit d\'horaire : Une session existe déjà à cette date et dans cette salle.');
      return;
    }
  
    // Vérifier si une session est déjà en cours
    const hasOngoingSession = this.sessions.some(
      (session) => session.status === 'En cours'
    );
  
    // Déterminer le statut de la nouvelle session
    let status: 'À venir' | 'En cours' | 'Terminée' = 'À venir';
    if (!hasOngoingSession && sessionStartTime <= DateNow) {
      status = 'En cours';
    } else if (sessionStartTime > DateNow) {
      status = 'À venir';
    }
  
    // Créer la nouvelle session
    const session: Session = {
      id: this.sessions.length + 1,
      ...this.newSession,
      status,
      teacher: 'Enseignant par défaut',
      students: [],
    };
  
    this.sessions.push(session);
  
    // Réinitialiser le formulaire
    this.newSession = {
      title: '',
      date: '',
      date_fin: '',
      room: '',
      description: '',
    };
  
    this.showCreateSession = false;
  }
  

  validateStartTime() {
    const sessionStartTime = new Date(this.newSession.date);
    const DateNow = new Date();
    this.isStartTimeInvalid = sessionStartTime.toISOString() < DateNow.toISOString();
  }
    // Ajouter un étudiant à la liste de présence
    addStudentToAttendance() {
      if (this.newStudent.name && this.newStudent.matricule) {
        this.manualAttendanceList.push({ ...this.newStudent });
        this.newStudent = { name: '', matricule: '' }; // Réinitialiser le formulaire
      }
    }

    // Supprimer un étudiant de la liste de présence
    removeStudentFromAttendance(student: { name: string; matricule: string }) {
      this.manualAttendanceList = this.manualAttendanceList.filter(
        (s) => s.matricule !== student.matricule
      );
    }
  
    ngOnInit() {
      this.initializeChart();
    }

    openDateTimePicker() {
      const input = document.getElementById('datetimeInput') as HTMLInputElement;
      input.showPicker(); // Ouvre le sélecteur de date/heure natif
    }

    ngAfterViewChecked() {
      if (this.showStats && !this.chart) {
        this.initializeChart();
      }
    }

    onSessionSelected(sessionId: number) {
      this.selectedSession = this.sessions.find((session) => session.id === sessionId) || null;
      //console.log(this.selectedSession?.id);
      if(this.selectedSession?.status == "En cours"){
        this.isSessionOn = true;
      }else{
        this.isSessionOn = false;
      }
      if (this.selectedSession?.status == "En cours" || this.selectedSession?.status == "Terminée"){
        this.showStats = true;
      }else{
        this.showStats = false;
      }
    }

    // Supprimer un étudiant de la liste de présence
    removeSessionFromList() {
      if (this.selectedSession){
        this.sessions.splice(this.selectedSession?.id, 1)
        this.selectedSession = null;
      }
    }
    // Gérer la suppression d'une session
    onSessionDeleted() { //sessionId: number
      this.sessions = this.sessions.filter((session) => session.id !== this.selectedSession?.id);
    }

    viewStudentProfile(value: number){}
  
    initializeChart() {
      const ctx = document.getElementById('sessionStatsChart') as HTMLCanvasElement;
      this.chart = new Chart(ctx, {
        type: 'bar', // Type de graphique
        data: {
          labels: ['Présents', 'Absents', 'En retard'],
          datasets: [{
            label: 'Statistiques de la session',
            data: [12, 5, 3], // Exemple de données
            backgroundColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 206, 86, 0.2)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 1,
          }],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }

}

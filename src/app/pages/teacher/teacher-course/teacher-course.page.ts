import { Component, OnInit, AfterViewChecked, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Chart } from 'chart.js/auto';
import { ToastController } from '@ionic/angular';

// import { Session } from 'src/app/components/session-list/session-list.component';
import { SessionService } from 'src/app/services/session.service';
import { AuthService } from 'src/app/services/auth.service';
import { Matiere, MetadataService } from 'src/app/services/metadata.service';
import { SessionListComponent } from 'src/app/components/session-list/session-list.component';
import { AlertController } from '@ionic/angular';

export interface Session_format {
  id?: string; // UUID généré par le backend
  matiere_id: string; // id ou nom de la matière
  salle_id: string;   // id ou nom de la salle
  niveau_id: string;  // id ou nom du niveau
  filiere_id: string; // id ou nom de la filière
  heure_debut: string; // ISO String : '2025-04-27T13:30:00.000Z'
  duree_minutes: number; // durée en minutes
  status: 'a_venir' | 'en_cours' | 'termine' | 'annule'; // état de la session
  salle?: string;
}
export interface Session_Laravel {
  id: number;
  statut: string;
  heure_debut: string; // format ISO (ex: "2025-05-17T10:00:00Z")
  heure_fin: string;
  lien?: string | null;
  description?: string | null;

  salle_id?: number | null;
  matiere_id: number;
  filiere_id: number;
  niveau_id: number;

  created_at: string;
  updated_at: string;

  // Relations facultatives à ajouter selon les besoins du front :
  matiere?: {
    id: number;
    code: string;
    nom: string;
  };

  salle?: {
    id: number;
    nom: string;
    latitude: string;
    longitude: string;
    rayon_metres: number;
  };

  enseignant?: {
    id: number;
    nom: string;
    prenom: string;
  };

  niveau?: {
    id: number;
    nom: string;
  };

  filiere?: {
    id: number;
    nom: string;
  };
}

export interface APISession {
  id: string;
  matiere: {
    id: number;
    code: string;
    nom: string;
    enseignant: number;
  };
  salle: {
    id: number;
    nom: string;
    latitude: string;
    longitude: string;
    rayon_metres: number;
  };
  heure_debut: string;
  duree_minutes: number;
  etat: string;
  created_at: string;
  updated_at: string;
  liste_presence: any[];
}

@Component({
  selector: 'app-teacher-course',
  templateUrl: './teacher-course.page.html',
  styleUrls: ['./teacher-course.page.scss'],
  standalone: false
})
export class TeacherCoursePage implements OnInit, AfterViewChecked {
  
  @ViewChild(SessionListComponent) sessionListComponent!: SessionListComponent;
  // UI states
  showStats = false;
  showAttendance = true;
  showCreateSession = false;
  isMenuOpen = false;
  isSmallScreen = false;
  isStartTimeInvalid = false;
  isSessionOn = false;

  // Data
  today: string = new Date().toISOString();
  sessions: Session_Laravel[] = [];
  APIsessions: APISession[] = [];
  selectedSession: Session_Laravel | null = null;
  manualAttendanceList: { name: string; matricule: string }[] = [];
  newStudent = { name: '', matricule: '' };
  
  enseignantId!: number;
  enseignantNom!: string;
  matieres: any[] = [];
  matieres_spec: any[] = [];
  salles: any[] = [];
  filieres: any[] = [];
  niveaux: any[] = [];

  userRole: 'etudiant' | 'enseignant' = 'enseignant';

  // Form
  sessionForm!: FormGroup;

  // Chart
  chart: any;

  constructor(
    private loadingController: LoadingController,
    private sessionService: SessionService,
    private storage: Storage,
    private fb: FormBuilder,
    private authService: AuthService,
    private metaDataService: MetadataService,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    this.initSessionForm();
    await this.loadUserData();
    this.loadMetadata();
    this.loadMatieres();
    //this.loadTeachingData();
  }

  async loadMatieres() {
    try {
        this.sessionService.getMatieresByEnseignant(this.enseignantId).subscribe({
        next: (matieres) => {
          this.matieres_spec = matieres; // stocke le tableau retourné dans ta variable
        },
        error: (err) => {
          console.error('Erreur lors du chargement des matières', err);
          this.matieres_spec = []; // optionnel : gérer le cas d'erreur
        }
      });
    } catch (error) {
      console.error('Erreur chargement matières', error);
      this.matieres_spec = [];
    }
  }

  onSessionUpdated() {
    if (this.sessionListComponent) {
      this.sessionListComponent.refreshCourseData();
    }
  }

  ngAfterViewChecked() {
    if (this.showStats && !this.chart) {
      this.initializeChart();
    }
  }

  onSessionsLoaded(loadedSessions: Session_Laravel[]) {
    this.sessions = loadedSessions;
  }

  // private async tryEnableMatiereField() {
  //     const niveau = this.sessionForm.get('niveau')?.value;
  //     const filiere = this.sessionForm.get('filiere')?.value;
  //     //console.log(niveau, filiere);
    
  //     if (niveau && filiere) {
  //       this.sessionForm.get('matiere')?.enable();
    
  //       // Charger les matières pour l'enseignant + ce niveau + cette filière
  //       try {
  //         const response = await this.metaDataService.getMatieresByEnseignantAndFilters(
  //           this.enseignantId,
  //           niveau, //.id || niveau
  //           filiere // .id || filiere
  //         ).toPromise();

  //         this.matieres = response?.matieres ?? [];
  //       } catch (error) {
  //         console.error('Erreur lors du chargement des matières filtrées', error);
  //         this.matieres = [];
  //       }
  //     } else {
  //       this.sessionForm.get('matiere')?.disable();
  //       this.matieres = []; // Remettre à zéro si pas encore prêt
  //     }
  // }
  private async tryEnableMatiereField() {
    const niveau = this.sessionForm.get('niveau')?.value;
    const filiere = this.sessionForm.get('filiere')?.value;

    if (niveau && filiere) {
      this.sessionForm.get('matiere')?.enable();

      try {
        const matieres = await this.sessionService.getMatieresByEnseignantAndFilters(
          this.enseignantId,
          niveau,
          filiere
        ).toPromise();

        this.matieres = matieres ?? [];
      } catch (error) {
        console.error('Erreur lors du chargement des matières filtrées', error);
        this.matieres = [];
      }
    } else {
      this.sessionForm.get('matiere')?.disable();
      this.matieres = [];
    }
  }
  
  private listenToLevelAndFiliereChanges() {
      this.sessionForm.get('niveau')?.valueChanges.subscribe(() => {
        this.tryEnableMatiereField();
      });
    
      this.sessionForm.get('filiere')?.valueChanges.subscribe(() => {
        this.tryEnableMatiereField();
      });
  }

  private initSessionForm() {
    this.sessionForm = this.fb.group({
      duree: ['', Validators.required],
      matiere: ['', Validators.required],
      filiere: ['', Validators.required],
      niveau: ['', Validators.required],
      salle: ['', Validators.required],
      heure_debut: ['', Validators.required]
    });

    this.listenToLevelAndFiliereChanges();
  }

  private async loadUserData() {
    const user = await this.authService.getUserData();
    this.enseignantId = user.id;
    this.enseignantNom = user.full_name;
    //console.log('Enseignant ID:', this.enseignantId);
  }

  private loadMetadata() {
    this.metaDataService.getAllMetadata().subscribe(data => {
      this.filieres = data.filieres;
      this.niveaux = data.niveaux;
      this.salles = data.salles;
    });
  }

  // private async loadTeachingData() {
  //   try {
  //     this.matieres = await this.sessionService.getMatieresByEnseignant(this.enseignantId).toPromise() || [];
  //     this.salles = await this.sessionService.getSalles().toPromise() || [];
  //   } catch (error) {
  //     console.error('Erreur lors de la récupération des données d\'enseignement', error);
  //   }
  // }

  async onSubmit() {
    if (this.sessionForm.invalid) return;

    const loading = await this.loadingController.create({
      message: 'Création de la session...',
      spinner: 'bubbles',
      backdropDismiss: false
    });
    await loading.present();

    const sessionData = this.prepareSessionData(this.sessionForm.value);
    if (!sessionData) return;

    //console.log('Session Data to Create:', sessionData);

    this.sessionService.createSession(sessionData).subscribe({
      next: async (session: Session_Laravel) => {
        await loading.dismiss();
        this.showToast("Session crée avec succès", 'success');
        this.sessions.push(session);
        this.sessionForm.reset();
        this.showCreateSession = false;
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Erreur lors de la création de la session', error);
        alert('Erreur lors de la création: ' + error.message);
      }
    });
  }


  prepareSessionData(formValue: any): any {
    const heure_debut = new Date(formValue.heure_debut);
    const dureeMinutes = parseInt(formValue.duree, 10);
    const heure_fin = new Date(heure_debut.getTime() + dureeMinutes * 60000);

    const formatToMysqlDatetime = (date: Date): string => {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    return {
      statut: "À venir",
      heure_debut: formatToMysqlDatetime(heure_debut),
      heure_fin: formatToMysqlDatetime(heure_fin),
      lien: "",
      description: "",
      salle_id: formValue.salle.id || formValue.salle,
      matiere_id: formValue.matiere.id || formValue.matiere,
      filiere_id: formValue.filiere.id || formValue.filiere,
      niveau_id: formValue.niveau.id || formValue.niveau,
      enseignant_id: this.enseignantId
    };
  }

  // private hasTimeConflict(start: Date, end: Date, salleNom: string): boolean {
  //   // Conflit de chevauchement de temps
  //   const overlap = this.sessions.some((session) => {
  //     const existingStart = new Date(session.heure_debut).getTime();
  //     const existingEnd = new Date(session.heure_fin).getTime();

  //     return start.getTime() < existingEnd && end.getTime() > existingStart;
  //   });

  //   // Conflit de salle à la même heure de début
  //   const sameRoomConflict = this.sessions.some((session) => {
  //     const sameStart = new Date(session.heure_debut).toISOString() === start.toISOString();
  //     const sameRoom = session.salle?.nom === salleNom;
  //     return sameStart && sameRoom;
  //   });

  //   // Alertes
  //   if (overlap) {
  //     alert('Conflit : chevauchement avec un autre cours.');
  //     return true;
  //   }

  //   if (sameRoomConflict) {
  //     alert('Conflit : salle déjà occupée à cette heure.');
  //     return true;
  //   }

  //   return false;
  // }

  

  onSessionSelected(session: Session_Laravel) {
    this.selectedSession = session;
    //console.log('SESSION :', this.selectedSession);

    if (!this.selectedSession) return;

    this.isSessionOn = session.statut === 'En cours';
    this.showStats = ['En cours', 'Terminée'].includes(session.statut);
  }


  onSessionDeleted() {
    if (this.selectedSession) {
      this.showDeleteAlert()
      //this.sessions = this.sessions.filter(session => session.id !== this.selectedSession!.id);
      //this.selectedSession = null;
    }
  }

  async showDeleteAlert() {
    const alert = await this.alertController.create({
      header: 'Annulation',
      message: 'Voulez-vous vraiment supprimer cette session ?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Supprimer',
          role: 'confirm',
          handler: async () => {
            if (this.selectedSession){
              const loading = await this.loadingController.create({
                message: 'Annulation de la session...',
                spinner: 'bubbles',
                backdropDismiss: false
              });
              await loading.present();
              this.sessionService.deleteSession(this.selectedSession.id).subscribe(async () => {
                this.sessions = this.sessions.filter(session => session.id !== this.selectedSession!.id);
                this.selectedSession = null;
                await this.sessionListComponent.refreshCourseData();
                await loading.dismiss();
                this.showToast("Session supprimée avec succès", 'success');
              });
            }
          }
        }
      ]
    });
  
    await alert.present();
  }

  addStudentToAttendance() {
    if (this.newStudent.name && this.newStudent.matricule) {
      this.manualAttendanceList.push({ ...this.newStudent });
      this.newStudent = { name: '', matricule: '' };
    }
  }

  removeStudentFromAttendance(student: { name: string; matricule: string }) {
    this.manualAttendanceList = this.manualAttendanceList.filter(s => s.matricule !== student.matricule);
  }

  removeSessionFromList() {
    if (this.selectedSession) {
      this.sessions = this.sessions.filter(session => session.id !== this.selectedSession!.id);
      this.selectedSession = null;
    }
  }

  openDateTimePicker() {
    const input = document.getElementById('datetimeInput') as HTMLInputElement;
    input?.showPicker();
  }

  initializeChart() {
    const ctx = document.getElementById('sessionStatsChart') as HTMLCanvasElement;
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [], // A remplir
          datasets: []
        },
        options: {}
      });
    }
  }

  viewStudentProfile(studentId: number) {
    // TODO: Implémenter navigation vers le profil étudiant
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'primary') {
      const toast = await this.toastController.create({
        message: message,
        duration: 3000,
        color: color,
        position: 'top'
      });
      await toast.present();
    }
}

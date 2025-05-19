import { Component, Input, Output, EventEmitter, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { Session_Laravel } from 'src/app/pages/teacher/teacher-course/teacher-course.page';
import { CommonModule } from '@angular/common';
import { Storage } from '@ionic/storage-angular';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MetadataService } from 'src/app/services/metadata.service';
import { Matiere, SessionService } from 'src/app/services/session.service';
import { Enseignant } from 'src/app/services/session.service';
import { Salle } from 'src/app/services/session.service';
import { SessionListComponent } from '../session-list/session-list.component';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-session-details',
  templateUrl: './session-details.component.html',
  styleUrls: ['./session-details.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SessionDetailsComponent {
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    USER_DATA: 'user_data',
    USER_TYPE: 'type_utilisateur'
  };

  @ViewChild(SessionListComponent) sessionListComponent!: SessionListComponent;
  @Output() sessionUpdated = new EventEmitter<void>();

  @Input() selectedSession: Session_Laravel | null = null;
  @Input() students: any[] = [];
  @Input() matieres_specifiques: any[] = [];
  @Input() role: 'etudiant' | 'enseignant' = 'etudiant';
  @Input() teacher_id?: number;
  @Input() filiere_id?: number;
  @Input() niveau_id?: number;

  @Output() viewStudent = new EventEmitter<number>();
  @Output() removeStudent = new EventEmitter<any>();
  @Output() terminateSession = new EventEmitter<void>();
  @Output() cancelSession = new EventEmitter<void>();

  matieres: any[] = [];
  salles: any[] = [];
  filieres: any[] = [];
  niveaux: any[] = [];

  matieresList: Matiere[] = [];
  enseignantsList: Enseignant[] = [];
  currentMatiere?: Matiere;
  currentEnseignant?: Enseignant;

  sallesList: Salle[] = [];
  currentSalle?: Salle;

  isEditing = false;
  editedSession: any = {};

  startEditing(session: any) {
    this.isEditing = true;
    this.loadMetadata();
    // Crée une copie de la session pour l'édition
    this.editedSession = { ...session };
    this.tryEnableMatiereField();
  }

  async tryEnableMatiereField() {
    const niveau = this.editedSession.niveau_id;
    const filiere = this.editedSession.filiere_id;
    this.editedSession.matiere_id = 0;
    // const niveau = this.editedSession.get('niveau')?.value;
    // const filiere = this.editedSession.get('filiere')?.value;

    if (niveau && filiere) {
      //this.editedSession.get('matiere')?.enable();

      if (this.teacher_id){
        try {
        const matieres = await this.sessionService.getMatieresByEnseignantAndFilters(
          this.teacher_id,
          niveau,
          filiere
        ).toPromise();

        this.matieres = matieres ?? [];
      } catch (error) {
        console.error('Erreur lors du chargement des matières filtrées', error);
        this.matieres = [];
      }
      }
    } else {
      //this.editedSession.get('matiere')?.disable();
      this.matieres = [];
    }
  }

  // private listenToLevelAndFiliereChanges() {
  //     this.editedSession.get('niveau')?.valueChanges.subscribe(() => {
  //       this.tryEnableMatiereField();
  //     });
    
  //     this.editedSession.get('filiere')?.valueChanges.subscribe(() => {
  //       this.tryEnableMatiereField();
  //     });
  // }

  cancelEditing() {
    this.isEditing = false;
    this.editedSession = {};
  }

  prepareSessionData(editedSession: any): any {
    const heure_debut = new Date(editedSession.heure_debut);
    const dureeMinutes = parseInt(editedSession.duree_minutes, 10);

    if (isNaN(heure_debut.getTime()) || isNaN(dureeMinutes)) {
      throw new Error("Heure de début ou durée invalide");
    }

    const heure_fin = new Date(heure_debut.getTime() + dureeMinutes * 60000);

    const formatToMysqlDatetime = (date: Date): string => {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    return {
      heure_debut: formatToMysqlDatetime(heure_debut),
      heure_fin: formatToMysqlDatetime(heure_fin),
      salle_id: parseInt(editedSession.salle_id),
      matiere_id: parseInt(editedSession.matiere_id),
      filiere_id: parseInt(editedSession.filiere_id),
      niveau_id: parseInt(editedSession.niveau_id)
    };
  }


  async loadMatieres(){
    const extractId = (value: any): number => typeof value === 'object' ? value.id : value;
    if (this.teacher_id){
      try {
        const matieres = await this.sessionService.getMatieresByEnseignantAndFilters(
          this.teacher_id,
          extractId(this.editedSession.niveau),
          extractId(this.editedSession.filiere)
        ).toPromise();

        this.matieres_specifiques = matieres ?? [];
      } catch (error) {
        console.error('Erreur lors du chargement des matières filtrées', error);
        this.matieres = [];
      }
    }
  }

  async saveSession() {
    const loading = await this.loadingController.create({
      message: 'Création de la session...',
      spinner: 'bubbles',
      backdropDismiss: false
    });
    await loading.present();

    const sessionPayload = this.prepareSessionData(this.editedSession);

    console.log('Session sauvegardée:', sessionPayload);

    if (this.selectedSession && this.editedSession.matiere_id !== 0){
      this.http.patch(`http://localhost:8000/api/sessions/${this.selectedSession.id}/`, sessionPayload).subscribe({
        next: async () => {
          //this.sessionListComponent.refreshCourseData();
          this.sessionUpdated.emit();
          await loading.dismiss();
          this.showToast("Session modifiée avec succès", 'success');
        },
        error: async (error) => {
          await loading.dismiss();
          console.error('Erreur lors de la mise à jour de la session', error);
        }
      });

      this.selectedSession = {
        ...this.selectedSession,
        ...sessionPayload
      };
    } else {
      await loading.dismiss();
      this.showToast("Informations manquante : Matière", 'danger');
    }

    this.isEditing = false;
  }


  private loadMetadata() {
    this.metadataService.getAllMetadata().subscribe(data => {
      this.filieres = data.filieres;
      this.niveaux = data.niveaux;
      this.salles = data.salles;
    });
  }

  constructor(
    private storage: Storage,
    private sessionService: SessionService,
    private metadataService: MetadataService,
    private http: HttpClient,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedSession']) {
      this.isEditing = false;
    }
    // if (changes['selectedSession'] && this.selectedSession) {
    //   await this.loadSessionDetails();
    // }
  }

  // private async loadSessionDetails() {
  //   // Charger les salles une seule fois
  //   this.metadataService.getSalles().subscribe(salles => {
  //     this.sallesList = salles;
  //     this.currentSalle = salles.find(s => s.id === this.selectedSession?.salle_id);
  //   });
    
  //   if (this.role === 'enseignant') {
  //     // Pour les enseignants: charger seulement les matières
  //     if (this.teacher_id) {
  //       this.sessionService.getMatieresByEnseignant(this.teacher_id).subscribe(matieres => {
  //         this.matieresList = matieres;
  //         this.currentMatiere = matieres.find(m => m.id === this.selectedSession?.matiere_id);
  //       });
  //     }
  //   } else {
  //     // Pour les étudiants: charger matières et enseignants
  //     if (this.filiere_id && this.niveau_id) {
  //       // Charger les matières pour la filière/niveau
  //       this.sessionService.getMatieresByFiliereAndNiveau(this.niveau_id, this.filiere_id)
  //         .subscribe(matieres => {
  //           this.matieresList = matieres;
  //           this.currentMatiere = matieres.find(m => m.id === this.selectedSession?.matiere_id);
  //         });

  //       // Charger les enseignants pour la filière/niveau
  //       this.sessionService.getEnseignantByFiliereAndNiveau(this.niveau_id, this.filiere_id)
  //         .subscribe(enseignants => {
  //           this.enseignantsList = enseignants;
  //           if (this.selectedSession?.enseignants && this.selectedSession.enseignants.length > 0) {
  //             // Si vous voulez le premier enseignant
  //             this.currentEnseignant = this.selectedSession.enseignants[0];
              
  //             // OU si vous voulez trouver un enseignant spécifique dans la liste
  //             // this.currentEnseignant = enseignants.find(e => 
  //             //   this.selectedSession?.enseignants?.some(sessionTeacher => sessionTeacher.id === e.id)
  //             // );
  //           }
  //         });
  //     }
  //   }
  // }


  // loadMatieres() {
  //   if (this.teacher_id){
  //     this.sessionService.getMatieresByEnseignant(this.teacher_id).subscribe(response => {
  //       this.matieresList = response;
  //     });
  //   }
  // }

  async ngOnInit() {
    const user = await this.storage.get(this.STORAGE_KEYS.USER_DATA);
    //this.listenToLevelAndFiliereChanges();
  }

  // addStudentToAttendance() {
  //   if (this.newStudent.name && this.newStudent.matricule) {
  //     console.log("Ajouté :", this.newStudent);
  //     // Ajouter à une liste, émettre un event, etc.
  //     this.newStudent = { name: '', matricule: '' }; // reset
  //   }
  // }

  // getMatiereNomById(id: number): string {
  //   const matiere = this.matieresList?.find(m => m.id === id);
  //   return matiere ? matiere.nom : '-';
  // }


  getStatusLabel(status: string): string {
    switch (status?.trim()) {
      case 'En cours': 
          return '🟡 En cours';
      case 'Terminée': 
          return '🔴 Terminée';
      case 'À venir': 
          return '🟢 À venir'; 
      case 'Planifiée': 
          return '⚪ Planifiée';
      default: 
          return status;
    }
  }

  getStatusClasses(status: string): string {
    return {
      'En cours': 'bg-yellow-100 text-yellow-700 border-yellow-500',
      'À venir': 'bg-green-100 text-green-700 border-green-500',
      'Terminée': 'bg-red-100 text-red-700 border-red-500'
    }[status] ?? 'bg-gray-100 text-gray-700 border-gray-500';
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

import { Component, OnInit } from '@angular/core';
import { JustificatifService } from 'src/app/services/justificatif.service';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingController } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { ToastService } from 'src/app/services/toast.service';
import { environment } from 'src/environments/environment';
import { SessionEventService } from 'src/app/services/session-event.service';

interface JustificatifAffichage {
  enseignant: {
    nom: string;
    prenom: string;
    photo: string;
  };
  matiere: {
    nom: string;
  };
  statut: 'Nouveau' | 'En cours' | 'Accepté' | 'Renvoyé' | 'Rejeté';
  presence: {
    session: {
      date: string;
      heure_debut: string;
      heure_fin: string;
    };
  };
  document?: string;
  source: 'justificatif' | 'absence';
  original?: any; // Pour les actions futures comme modification/suppression
}


@Component({
  selector: 'app-student-justificatif',
  templateUrl: './student-justificatif.page.html',
  styleUrls: ['./student-justificatif.page.scss'],
  standalone: false
})
export class StudentJustificatifPage implements OnInit {
  isMenuOpen = false;
  isSmallScreen = false;
  justificatifs!: any[];
  absences: any[] = [];
  selectedAbsence: any = null;
  showJustificatifModal = false;
  justification = {
    message: '',
    piece_jointe: null as File | null
  };
  justificatifsAffiches: JustificatifAffichage[] = [];

  message: string = '';
  piece_jointe: string = '';

  isEditing = false;
  utilisateur!: 'ETU' | 'ENS'; // à définir selon l'utilisateur connecté
  fileToUpload: File | null = null;
  selectedJustificatif!: any;
  showModifModal = false;

  apiUrl = environment.apiUrl;

  startEdit() {
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.showModifModal = false;
    this.fileToUpload = null;
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.fileToUpload = input.files[0];
    }
  }

  getPieceJointeUrl(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }


  submitModification() {
    const formData = new FormData();
    formData.append('utilisateur', this.utilisateur);

    if (this.utilisateur === 'ETU') {
      formData.append('message', this.selectedJustificatif.message);
      if (this.fileToUpload) {
        formData.append('piece_jointe', this.fileToUpload);
      }
    }

    if (this.utilisateur === 'ENS') {
      formData.append('reponse_enseignant', this.selectedJustificatif.reponse_enseignant || '');
      formData.append('statut', this.selectedJustificatif.statut);
    }

    this.justificatifService.modifierJustificatif(this.selectedJustificatif.id, formData).subscribe(() => {
      this.cancelEdit();
      // Recharger ou mettre à jour la liste
    });
  }

  presentRefreshToast() {
    const toast = this.toastService.show("Rafraichissement de la page...", 'info');
  }

  constructor(private justificatifService: JustificatifService,
    private authService: AuthService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastService: ToastService,
    private sessionEventService: SessionEventService) { }

  async ngOnInit() {
    this.utilisateur = await this.authService.getUsersType();
    //this.loadAbsences();
    //this.chargerJustificatifs();

    this.sessionEventService.refreshTrigger$.subscribe(() => {
      this.loadAbsences();
      this.chargerJustificatifs();
      //this.presentRefreshToast();
    });
  }

  // async chargerDonnees() {
  //   const loading = await this.loadingController.create({
  //     message: 'Chargement...',
  //     spinner: 'bubbles',
  //     backdropDismiss: false
  //   });
  //   await loading.present();

  //   const etudiantId = await this.authService.getUserId();
  //   if (!etudiantId) return loading.dismiss();

  //   try {
  //     // Récupérer justificatifs
  //     const [justificatifs, absences] = await Promise.all([
  //       this.justificatifService.getJustificatifsEtudiant().toPromise(),
  //       this.justificatifService.getAbsencesEtudiant(etudiantId).toPromise()
  //     ]);

  //     const fusionnes: JustificatifAffichage[] = [];

  //     // Mapper les justificatifs normaux
  //     for (const j of justificatifs.justificatifs) {
  //       fusionnes.push({
  //         enseignant: j.enseignant,
  //         matiere: j.matiere,
  //         statut: j.statut,
  //         presence: j.presence,
  //         document: j.document,
  //         source: 'justificatif',
  //         original: j
  //       });
  //     }

  //     // Mapper les absences en justificatifs de statut "Nouveau"
  //     for (const a of absences) {
  //       fusionnes.push({
  //         enseignant: a.enseignant, // Assure-toi que cette clé existe
  //         matiere: a.session?.matiere,
  //         statut: 'Nouveau',
  //         presence: {
  //           session: {
  //             date: a.session?.date,
  //             heure_debut: a.session?.heure_debut,
  //             heure_fin: a.session?.heure_fin
  //           }
  //         },
  //         source: 'absence',
  //         original: a
  //       });
  //     }

  //     this.justificatifsAffiches = fusionnes;
  //   } catch (err) {
  //     console.error('Erreur chargement des données', err);
  //   } finally {
  //     await loading.dismiss();
  //   }
  // }

  async loadAbsences() {
    const loading = await this.loadingController.create({
      message: 'Chargement...',
      spinner: 'bubbles',
      backdropDismiss: false
    });
    await loading.present();

    const etudiantId = await this.authService.getUserId();
    if (etudiantId) {
      this.justificatifService.getAbsencesEtudiant(etudiantId).subscribe({
        next: async (absences: any) => {
          this.absences = absences.map((absence: any) => ({
            ...absence,
            session_details: absence.session
          }));
          await loading.dismiss();
        },
        error: async (err) => { console.error(err); await loading.dismiss(); }
      });
    }
  }

  selectAbsence(absence: any) {
    this.selectedAbsence = absence;
    this.showJustificatifModal = true;
  }

  onFileChange(event: any) {
    this.justification.piece_jointe = event.target.files[0];
  }

  async submitJustification() {
    const loading = await this.loadingController.create({
      message: 'Chargement...',
      spinner: 'bubbles',
      backdropDismiss: false
    });
    await loading.present();

    const etu_id = await this.authService.getUsersId();
    const data = {
      ...this.justification,
      presence_id: this.selectedAbsence.id,
      matiere_id: this.selectedAbsence.session_details.matiere_id,
      enseignant_id: this.selectedAbsence.session_details.enseignant_id,
      etudiant_id: etu_id
    };
    console.log(data);

    this.justificatifService.creerJustificatif(data).subscribe({
      next: async () => {
        this.showJustificatifModal = false;
        this.justification = { message: '', piece_jointe: null };
        this.loadAbsences();
        this.chargerJustificatifs();
        await loading.dismiss();
      },
      error: async (err) => { console.error(err); await loading.dismiss(); }
    });
  }

  chargerJustificatifs() {
    this.justificatifService.getJustificatifsEtudiant().subscribe({
      next: (res) => {
        this.justificatifs = res.justificatifs;
      },
      error: (err) => {
        console.error('Erreur chargement des justificatifs', err);
      }
    });
  }

  modifyJustificatif(justificatif: any) {
    this.selectedJustificatif = justificatif;
    this.showModifModal = true;
  }

  async deleteJustification(selectedJustificatif: any) {
    const alert = await this.alertController.create({
      header: 'Suppression',
      message: 'Voulez-vous vraiment supprimer ce justificatif ?',
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
            if (selectedJustificatif) {
              const loading = await this.loadingController.create({
                message: 'Suppression du justificatif...',
                spinner: 'bubbles',
                backdropDismiss: false
              });
              await loading.present();

              this.justificatifService.deleteJustificatif(selectedJustificatif.id).subscribe({
                next: async () => {
                  this.chargerJustificatifs();
                  await loading.dismiss();
                  this.toastService.show("Justificatif supprimé avec succès", 'success');
                },
                error: async (err) => {
                  await loading.dismiss();
                  console.error('Erreur suppression justificatif:', err);
                  this.toastService.show("Erreur lors de la suppression. Veuillez réessayer.", 'error');
                }
              });
            }
          }
        }
      ]
    });

    await alert.present();
  }


}

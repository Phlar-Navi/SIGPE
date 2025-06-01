import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { JustificatifService } from 'src/app/services/justificatif.service';
import { AlertController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { ToastService } from 'src/app/services/toast.service';
import { environment } from 'src/environments/environment';
import { SessionEventService } from 'src/app/services/session-event.service';

@Component({
  selector: 'app-teacher-justificatif',
  templateUrl: './teacher-justificatif.page.html',
  styleUrls: ['./teacher-justificatif.page.scss'],
  standalone: false
})
export class TeacherJustificatifPage implements OnInit {
  justificatifs: any[] = [];
  selectedJustificatif: any = null;
  showReponseModal = false;
  reponse = {
    decision: 'accepte',
    commentaire: ''
  };
  isMenuOpen = false;
  isSmallScreen = false;

  showJustificatifModal = false;
  isEditing = false;
  utilisateur!: 'ETU' | 'ENS'; // à définir selon l'utilisateur connecté
  fileToUpload: File | null = null;

  apiUrl = environment.apiUrl;

  startEdit() {
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.showJustificatifModal = false;
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


  async submitModification() {
    // const loading = await this.loadingController.create({
    //   message: 'Modificaion de la réponse...',
    //   spinner: 'bubbles',
    //   backdropDismiss: false
    // });
    // await loading.present();
    
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
      this.loadJustificatifs();
      // Recharger ou mettre à jour la liste
    });
  }

  presentRefreshToast() {
    const toast = this.toastService.show("Rafraichissement de la page...", 'info');
  }

  constructor(private justificatifService: JustificatifService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private sessionEventService: SessionEventService) { }

  async ngOnInit() {
    this.utilisateur = await this.authService.getUsersType();
    //console.log(this.utilisateur);
    //this.loadJustificatifs();

    this.sessionEventService.refreshTrigger$.subscribe(() => {
      this.loadJustificatifs();
      //this.presentRefreshToast();
    });
  }

  async loadJustificatifs() {
    const loading = await this.loadingController.create({
      message: 'Chargement...',
      spinner: 'bubbles',
      backdropDismiss: false
    });
    await loading.present();

    const enseignantId = await this.authService.getUserId();
    if (enseignantId) {
      this.justificatifService.getJustificatifsEnseignant(enseignantId).subscribe({
        next: async (response: any) => {
          this.justificatifs = response.justificatifs;
          await loading.dismiss();
        },
        error: async (err) => { console.error(err); await loading.dismiss(); }
      });
    }
  }

  selectJustificatif(justificatif: any) {
    this.selectedJustificatif = justificatif;
    this.showReponseModal = true;
  }

  modifyJustificatif(justificatif: any) {
    this.selectedJustificatif = justificatif;
    this.showJustificatifModal = true;
  }

  async submitReponse() {
    const loading = await this.loadingController.create({
      message: 'Enregistrement de la réponse...',
      spinner: 'bubbles',
      backdropDismiss: false
    });
    await loading.present();
              
    this.justificatifService.repondreJustificatif(
      this.selectedJustificatif.id,
      this.reponse.decision,
      this.reponse.commentaire
    ).subscribe({
      next: async () => {
        this.showReponseModal = false;
        this.loadJustificatifs(); // Rafraîchir la liste
        await loading.dismiss();
      },
      error: async (err) => { console.error(err); await loading.dismiss(); }
    });
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
                  this.loadJustificatifs();
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

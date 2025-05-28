import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Storage } from '@ionic/storage-angular';
import { MetadataService } from 'src/app/services/metadata.service';
import { LoadingController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    USER_DATA: 'user_data',
    USER_TYPE: 'type_utilisateur'
  };

  user: any;

  isMenuOpen = false; // État du menu (ouvert/fermé)
  isSmallScreen = window.innerWidth < 768; // Détecte si l'écran est petit

  profileImagePreview: string = "";
  showPassword: boolean = false;
  facialImagePreview: string = "";

  profileForm!: FormGroup;
  defaultValues = {
    nom: '',
    prenom: '',
    matricule: '',
    telephone: '',
    email: '',
  };
  // defaultValues = {
  //   nom: 'Doe',
  //   prenom: 'John',
  //   matricule: '21S00000',
  //   telephone: '+33612345678',
  //   email: 'john.doe@example.com',
  // };

  // type: string = 'password';

  profilePhoto?: File;
  facialPhoto?: File;

  get passwordGroup(): FormGroup {
    return this.profileForm.get('passwordGroup') as FormGroup;
  }

  constructor(private fb: FormBuilder, 
    private storage: Storage, 
    private metadataService: MetadataService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private authService: AuthService,
    private toastService: ToastService) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      nom: [''],
      prenom: [''],
      matricule: [''],
      telephone: [''],
      email: ['', [Validators.email]],

      passwordGroup: this.fb.group({
        currentPassword: [''],
        newPassword: ['', [Validators.minLength(8)]],
        confirmPassword: [''],
      }, { validators: this.passwordMatchValidator }),
    });

    this.storage.get(this.STORAGE_KEYS.USER_DATA).then(userData => {
      this.user = userData;

      this.profileForm.patchValue({
        nom: this.user.nom || '',
        prenom: this.user.prenom || '',
        matricule: this.user.matricule || '',
        email: this.user.email || '',
        telephone: '+237000000000'
      });

      this.profileImagePreview = this.user.photo 
        ? this.user.photo 
        : 'assets/images/profil.jpg';
    });
  }


  togglePasswordVisibility(){
    //this.type = 'text';
    this.showPassword = !this.showPassword;
  }

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  onPhotoSelected(event: any, type: 'profile' | 'facial') {
    const file = event.target.files[0];
    if (file) {
      if (type === 'profile') this.profilePhoto = file;
      else this.facialPhoto = file;
    }
  }

  // onSubmit() {
  //   const formData = new FormData();
  //   const formValues = this.profileForm.value;

  //   for (let key of ['nom', 'prenom', 'matricule', 'telephone', 'email']) {
  //     if (formValues[key]) {
  //       formData.append(key, formValues[key]);
  //     }
  //   }

  //   if (formValues.passwordGroup.newPassword) {
  //     formData.append('newPassword', formValues.passwordGroup.newPassword);
  //     formData.append('currentPassword', formValues.passwordGroup.currentPassword);
  //   }

  //   if (this.profilePhoto) formData.append('profilePhoto', this.profilePhoto);
  //   if (this.facialPhoto) formData.append('facialPhoto', this.facialPhoto);

  //   // Envoie au backend ici...
  //   console.log('FormData prêt à être envoyé:');
  //   console.log('Contenu de FormData :');
  //   formData.forEach((value, key) => {
  //     console.log(`${key}:`, value);
  //   });

  // }

  async onSubmit() {
    const loading = await this.loadingController.create({
      message: 'Modification du compte...',
      spinner: 'bubbles',
      backdropDismiss: false
    });
    await loading.present();
    
    const formData = new FormData();
    const formValues = this.profileForm.value;

    for (let key of ['nom', 'prenom', 'matricule', 'telephone', 'email']) {
      if (formValues[key]) {
        formData.append(key, formValues[key]);
      }
    }

    if (formValues.passwordGroup.newPassword) {
      formData.append('password', formValues.passwordGroup.newPassword);
    }

    if (this.profilePhoto) {
      formData.append('photo', this.profilePhoto);
    }

    formData.append('id', this.user.id);
    //console.log(this.user.id);

    this.metadataService.updateEtudiant(this.user.id, formData, this.user.utilisateur).subscribe({
      next: async (res) => {
        await this.authService.refreshUserData();
        this.toastService.show("Modification effectuée avec succès!", 'success');
        //console.log('Mise à jour réussie:', res);
        await loading.dismiss();
      },
      error: async (err) => {
        this.toastService.show("Erreur lors de la tentative de modification du compte...", 'error');
        //console.error('Erreur lors de la mise à jour:', err);
        await loading.dismiss();
      }
    });
  }

  onDeleteAccount() {
    if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      // Appel à la suppression via service
      console.log("Suppression du compte demandée");
    }
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

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  isMenuOpen = false; // État du menu (ouvert/fermé)
  isSmallScreen = window.innerWidth < 768; // Détecte si l'écran est petit

  profileImagePreview: string = "";
  showPassword: boolean = false;
  facialImagePreview: string = "";

  profileForm!: FormGroup;
  defaultValues = {
    nom: 'Doe',
    prenom: 'John',
    matricule: '21S00000',
    telephone: '+33612345678',
    email: 'john.doe@example.com',
  };

  profilePhoto?: File;
  facialPhoto?: File;

  get passwordGroup(): FormGroup {
    return this.profileForm.get('passwordGroup') as FormGroup;
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      nom: [this.defaultValues.nom],
      prenom: [this.defaultValues.prenom],
      matricule: [this.defaultValues.matricule],
      telephone: [this.defaultValues.telephone],
      email: [this.defaultValues.email, [Validators.email]],

      // Section mot de passe
      passwordGroup: this.fb.group({
        currentPassword: [''],
        newPassword: ['', [Validators.minLength(8)]],
        confirmPassword: [''],
      }, { validators: this.passwordMatchValidator }),
    });
  }

  togglePasswordVisibility(){}

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

  onSubmit() {
    const formData = new FormData();
    const formValues = this.profileForm.value;

    for (let key of ['nom', 'prenom', 'matricule', 'telephone', 'email']) {
      if (formValues[key]) {
        formData.append(key, formValues[key]);
      }
    }

    if (formValues.passwordGroup.newPassword) {
      formData.append('newPassword', formValues.passwordGroup.newPassword);
      formData.append('currentPassword', formValues.passwordGroup.currentPassword);
    }

    if (this.profilePhoto) formData.append('profilePhoto', this.profilePhoto);
    if (this.facialPhoto) formData.append('facialPhoto', this.facialPhoto);

    // Envoie au backend ici...
    console.log('FormData prêt à être envoyé:');
    console.log('Contenu de FormData :');
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

  }

  onDeleteAccount() {
    if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      // Appel à la suppression via service
      console.log("Suppression du compte demandée");
    }
  }

}

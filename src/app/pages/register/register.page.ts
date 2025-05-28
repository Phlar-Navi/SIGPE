import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { MetadataService } from 'src/app/services/metadata.service';
import { AuthService } from 'src/app/services/auth.service';
import { Storage } from '@ionic/storage-angular'
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  userData: any = {
    prenom: 'Inconnu'
    // type_utilisateur: 'ETU'
  };
  photoFaciale: File | null = null;

  filieres: any[] = [];
  niveaux: any[] = [];
  specialites: any[] = ['Developemment des applications'];

  // selectedFiliere: string = '';
  // selectedNiveaux: string[] = [];
  // selectedSpecialites: string[] = [];

  // username: string = '';
  // email: string = '';
  // password: string = '';
  // confirmPassword: string = '';
  // matricule: string = "";
  // telephone: string = "";

  constructor(private toastController: ToastController,
    private http: HttpClient, 
    private router: Router, 
    private loadingController: LoadingController,
    private alertController: AlertController,
    private metadataService: MetadataService,
    private authService: AuthService,
    private _storage: Storage,
    private toastService: ToastService) { }

  ngOnInit() {
    this.filieres = ['Informatique', 'Mathematiques', 'Physiques'];
    this.niveaux = [1, 2, 3, 4, 5];
    // this.metadataService.getAllMetadata().subscribe(data => {
    //   this.filieres = data.filieres;
    //   this.niveaux = data.niveaux;
    //   this.specialites = data.specialites;
    // });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('Fichier sélectionné:', file.name, file.size, file.type); // Debug
      this.userData.photo = file;
      
      // Prévisualisation pour vérification
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('Preview Base64:', e.target?.result?.toString().substring(0, 50) + '...');
      };
      reader.readAsDataURL(file);
    } else {
      console.warn('Aucun fichier sélectionné');
    }
  }

  async onSignup(form: NgForm) {
    // Validation initiale du formulaire
    if (form.invalid) {
      await this.showAlert('Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
  
    // Validation spécifique aux étudiants
    // if (this.userData.type_utilisateur === 'ETU') {
    //   if (!this.userData.filiere || !this.userData.niveau) {
    //     await this.showAlert('Champs requis', 'Veuillez sélectionner votre filière et votre niveau');
    //     return;
    //   }
    //   // `specialite` peut rester vide selon le modèle
    // }
  
    const loading = await this.loadingController.create({
      message: 'Création de votre compte...',
      spinner: 'crescent',
      backdropDismiss: false
    });
    await loading.present();
  
    try {
      const formData = this.buildFormData();
  
      const response: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8000/api/registerEtudiant', formData, {
          headers: new HttpHeaders({ 'Accept': 'application/json' }),
          observe: 'response'
        })
      );
  
      if (response.status === 200) {
        await this.handleSuccessfulRegistration(response.body);
      } else {
        throw new Error(`Réponse inattendue: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Erreur complète:', error);
      if (error.error && error.error.errors) {
        console.error('Détails des erreurs Laravel :', error.error.errors);
      }
      //await this.handleRegistrationError(error);
    } finally {
      await loading.dismiss();
    }
  }
  
  // Generation du formulaire
  private buildFormData(): FormData {
    const formData = new FormData();
  
    Object.entries(this.userData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value as any);
      }
    });
  
    formData.append('filiere', 'Informatique');
    formData.append('niveau', '1');
    this.logFormDataContents(formData);
  
    return formData;
  }
  
  
  private logFormDataContents(formData: FormData) {
    console.group('FormData Contents');
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(key, ':', `File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(key, ':', value);
      }
    });
    console.groupEnd();
  }
  
  private debugFormData(formData: FormData) {
    // Méthode compatible avec tous les navigateurs
    console.log('Contenu du FormData:');
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
      } else {
        console.log(`${key}:`, value);
      }
    });
  }
  
  private async handleSuccessfulRegistration(response: any) {
    // Supprimer les anciennes données avant d'enregistrer les nouvelles
    await this._storage?.remove('etudiant');
    await this._storage?.remove('access_token');
  
    // Stockage sécurisé des tokens
    await this._storage?.set('access_token', response.access);
    await this._storage?.set('etudiant', response.etudiant);
  
    console.log(response);
    // Affichage du feedback
    this.toastService.show('Inscription réussie !', 'success');
  
    // Redirection adaptée
    this.redirectBasedOnUserType(response.type_utilisateur);
  }
  
  
  private async handleRegistrationError(error: any) {
    let errorMessage = 'Erreur lors de la création du compte';
    
    if (error.error) {
      if (typeof error.error === 'string') {
        try {
          const parsedError = JSON.parse(error.error);
          errorMessage = parsedError.detail || errorMessage;
        } catch {
          errorMessage = error.error;
        }
      } else if (error.error.detail) {
        errorMessage = error.error.detail;
      } else if (error.error.non_field_errors) {
        errorMessage = error.error.non_field_errors.join(', ');
      }
    }
  
    await this.showAlert('Erreur', errorMessage);
  }

  //Renvoyer l'user sur une page en fonction de son type
  private redirectBasedOnUserType(userType: string) {
    this.router.navigate(['/student-dashboard']);
    // switch(userType) {
    //   case 'ETU':
    //     this.router.navigate(['/student-dashboard']);
    //     break;
    //   case 'ENS':
    //     this.router.navigate(['/teacher-dashboard']);
    //     break;
    //   case 'ADM':
    //     this.router.navigate(['/admin-dashboard']);
    //     break; 
    //   default:
    //     this.router.navigate(['/']);
    // }
  }

  // Social Login Methods
  async signUpWithGoogle() {
    try {
      console.log('Google Signup initiated');
      this.toastService.show('Inscription avec Google', 'success');
      // TODO: Implement Google Sign-Up
    } catch (error) {
      this.toastService.show('Erreur de connexion Google', 'error');
    }
  }

  async signUpWithFacebook() {
    try {
      console.log('Facebook Signup initiated');
      this.toastService.show('Inscription avec Facebook', 'success');
      // TODO: Implement Facebook Sign-Up
    } catch (error) {
      this.toastService.show('Erreur de connexion Facebook', 'error');
    }
  }

  async signUpWithApple() {
    try {
      console.log('Apple Signup initiated');
      this.toastService.show('Inscription avec Apple', 'success');
      // TODO: Implement Apple Sign-Up
    } catch (error) {
      this.toastService.show('Erreur de connexion Apple', 'error');
    }
  }

  validatePassword(password: string): boolean {
    // Simple password validation (you can enhance this)
    return password.length >= 6;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
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

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  private async showErrorAlert(error: any) {
    console.error('Erreur d\'inscription:', error);
    await this.showAlert(
      'Erreur', 
      error.error?.message || 'Une erreur est survenue lors de l\'inscription'
    );
  }


}

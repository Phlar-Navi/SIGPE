import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  userData: any = {
    matricule: '',
    password: '',
    user_type:''
  };
  types: string[] = ['Etudiant', 'Enseignant', 'Admin'];
  
  async onLogin(form: NgForm) {
    const loading = await this.loadingController.create({
      message: 'Connexion au compte',
      spinner: 'crescent',
      backdropDismiss: false
    });
    await loading.present();

    if (form.valid) {
      const { matricule, password, user_type } = this.userData;

      // Important : convertit 'Etudiant' en 'etudiant' si nécessaire
      const normalizedUserType = user_type.toLowerCase(); // 'Etudiant' → 'etudiant'

      this.authService.login(matricule, password, normalizedUserType).subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          // this.redirectBasedOnUserType(res.utilisateur); // ou res.type_utilisateur selon ta réponse
          form.resetForm();
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Erreur de login', err);
        }
      });
    }

  }



  // private redirectBasedOnUserType_DJANGO(userType: string) {
  //   //this.router.navigate(['/student-dashboard']);
  //   switch(userType) {
  //     case 'ETU':
  //       this.router.navigate(['/student-dashboard']);
  //       break;
  //     case 'ENS':
  //       this.router.navigate(['/teacher-dashboard']);
  //       break;
  //     case 'ADM':
  //       this.router.navigate(['/admin-dashboard']);
  //       break; 
  //     default:
  //       this.router.navigate(['/']);
  //   }
  // }
  
  loginWithGoogle(){}
  loginWithFacebook(){}
  loginWithApple(){}

  constructor(private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
  }

}

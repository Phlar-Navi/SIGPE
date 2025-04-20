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
    username: '',
    password: ''
  };
  
  async onLogin(form: NgForm) {
    const loading = await this.loadingController.create({
      message: 'Connexion au compte',
      spinner: 'crescent',
      backdropDismiss: false
    });
    await loading.present();

    if (form.valid) {
      this.authService.login({ username: this.userData.username, password: this.userData.password}).subscribe({
        next: async (res: any) => {
          // await this.authService.saveTokens(res.access, res.refresh);
          await loading.dismiss();
          this.redirectBasedOnUserType(res.type_utilisateur);
          form.resetForm();
        },
        error: async (err) => {
          await loading.dismiss();
          console.log('Erreur de login', err);
        }
      });
    }
  }

  //Renvoyer l'user sur une page en fonction de son type
  private redirectBasedOnUserType(userType: string) {
    switch(userType) {
      case 'ETU':
        this.router.navigate(['/student-dashboard']);
        break;
      case 'ENS':
        this.router.navigate(['/teacher-dashboard']);
        break;
      case 'ADM':
        this.router.navigate(['/admin-dashboard']);
        break; 
      default:
        this.router.navigate(['/']);
    }
  }
  
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

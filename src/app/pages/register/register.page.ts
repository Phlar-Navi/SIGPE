import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {

  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(private toastController: ToastController, 
    private router: Router, 
    private loadingController: LoadingController) { }

  ngOnInit() {
  }

  async onSignup(form: NgForm) {
    //Afficher le chargement
    const loading = await this.loadingController.create({
      message: 'Inscription...',
      spinner: 'lines'
    });
    await loading.present();
    this.showToast("Inscription réussie !", 'success');

    await loading.dismiss();

    this.router.navigateByUrl("/student-dashboard");
  }

  // Social Login Methods
  async signUpWithGoogle() {
    try {
      console.log('Google Signup initiated');
      this.showToast('Inscription avec Google', 'primary');
      // TODO: Implement Google Sign-Up
    } catch (error) {
      this.showToast('Erreur de connexion Google', 'danger');
    }
  }

  async signUpWithFacebook() {
    try {
      console.log('Facebook Signup initiated');
      this.showToast('Inscription avec Facebook', 'primary');
      // TODO: Implement Facebook Sign-Up
    } catch (error) {
      this.showToast('Erreur de connexion Facebook', 'danger');
    }
  }

  async signUpWithApple() {
    try {
      console.log('Apple Signup initiated');
      this.showToast('Inscription avec Apple', 'primary');
      // TODO: Implement Apple Sign-Up
    } catch (error) {
      this.showToast('Erreur de connexion Apple', 'danger');
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


}

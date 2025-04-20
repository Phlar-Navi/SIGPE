import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarStateService } from 'src/app/services/sidebar-state.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AlertController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule] // Importe CommonModule pour utiliser ngClass
})
export class SidebarComponent  implements OnInit {
  isMenuOpen = false;
  isSmallScreen = false;
  activePage: number = 1;
  showLogoutModal = false;
  today = new Date();

  routesByUserType: any = {
    'ETU': {
      dashboard: '/student-dashboard',
      profile: '/profile',
      notifications: '/notification',
      justificatifs: '/justification',
      sessions: '/student-course'
    },
    'ENS': {
      dashboard: '/teacher-dashboard',
      profile: '/profile',
      notifications: '/notification',
      justificatifs: '/justification',
      sessions: '/teacher-course'
    },
    'ADM': {
      dashboard: '/admin-dashboard',
      profile: '/profile',
      notifications: '/notification',
      justificatifs: '/',
      sessions: '/'
    }
  };

  user: any;

  constructor(public sidebarState: SidebarStateService,
    public router: Router,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ){}

  async showLogoutAlert() {
    const alert = await this.alertController.create({
      header: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Déconnexion',
          role: 'confirm',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
  
    await alert.present();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
  }

  getRoute(key: string): string {
    if (!this.user || !this.user.type_utilisateur) return '/login';
    return this.routesByUserType[this.user.type_utilisateur]?.[key] || '/';
  }  

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  isRouteActive(key: string): boolean {
    const currentRoute = this.router.url;
    return currentRoute === this.getRoute(key);
  }
  

  async ngOnInit() {
    this.checkScreenSize();
    this.authService.isReady$().subscribe(async (ready) => {
      if (ready) {
        this.user = await this.authService.getUserData();
        console.log(this.user);
      }
    });
  }
  

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  gotoPage(value: number){
    this.activePage = value;

    switch (value){
      case 1:
        this.router.navigateByUrl("/student-dashboard");
        break;
      case 2:
        this.router.navigateByUrl("/profile");
        //this.router.navigate(['/profile'])
        break;
      case 3:
        this.router.navigateByUrl("/notification");
        break;
      case 4:
          this.router.navigateByUrl("/justification");
          break;
      case 5:
        this.router.navigateByUrl("/student-course");
        break;
      default:
        this.router.navigateByUrl("/student-dashboard");
        break;
    }

    this.toggleMenu(); // Ferme le menu sur mobile
  }

  // toggleMenu() {
  //   this.sidebarState.toggleMenu();
  // }

  checkScreenSize() {
    this.isSmallScreen = window.innerWidth < 768; // 768px est la breakpoint pour les petits écrans
  }

  logout() {
    this.showLogoutModal = true; // Ouvre la modale
  }

  async confirmLogout() {
    const loading = await this.loadingController.create({
      message: 'Déconnexion...',
      spinner: 'crescent',
      backdropDismiss: false
    });
    await loading.present();
    
    this.authService.logout().then(async () => {
      this.showLogoutModal = false;
      await loading.dismiss();
      this.router.navigate(['/login']);
    });
  }

  cancelLogout() {
    this.showLogoutModal = false;
  }

  handleModalDismiss(event: any) {
    this.showLogoutModal = false;
  } 

}

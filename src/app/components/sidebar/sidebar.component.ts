import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarStateService } from 'src/app/services/sidebar-state.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AlertController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

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
  position: string = '';

  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    USER_DATA: 'user_data',
    USER_TYPE: 'type_utilisateur'
  };

  routesByUserType: any = {
    'ETU': {
      dashboard: '/student-dashboard',
      profile: '/profile',
      notifications: '/notification',
      justificatifs: '/student-justificatif',
      sessions: '/student-course'
    },
    'ENS': {
      dashboard: '/teacher-dashboard',
      profile: '/profile',
      notifications: '/notification',
      justificatifs: '/teacher-justificatif',
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
    private loadingController: LoadingController,
    private storage: Storage
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
          try {
            // 1. Déconnexion éventuelle côté serveur
            await this.authService.logout(); // à conserver si tu fais appel à une API

            // 2. Nettoyer les données utilisateur
            await this.storage.remove(this.STORAGE_KEYS.ACCESS_TOKEN);
            await this.storage.remove(this.STORAGE_KEYS.USER_DATA);
            await this.storage.remove(this.STORAGE_KEYS.USER_TYPE);

            // 3. (Optionnel) Nettoyer d’autres caches/mémoires en local (ex: variable utilisateur en mémoire)

            // 4. Redirection vers login
            this.router.navigate(['/login'], { replaceUrl: true }); // replaceUrl évite retour en arrière via bouton "back"
          } catch (error) {
            console.error('Erreur lors de la déconnexion :', error);
          }
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
    if (!this.user || !this.user.utilisateur) return '/login';
    return this.routesByUserType[this.user.utilisateur]?.[key] || '/';
  }  

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  isRouteActive(key: string): boolean {
    const currentRoute = this.router.url;
    return currentRoute === this.getRoute(key);
  }

  getActiveRouteName(): string {
    const url = this.router.url; // ex: "/student-dashboard" ou "/profile"
    
    // Parcourir les routes possibles (routesByUserType) pour trouver la clé correspondant à l'url active
    if (!this.user || !this.user.utilisateur) return '';

    const routes = this.routesByUserType[this.user.utilisateur];
    for (const [key, path] of Object.entries(routes)) {
      if (path === url) {
        return key; // par exemple 'dashboard' ou 'profile'
      }
    }
    return '';
  }

  async ngOnInit() {
    this.checkScreenSize();

    // Si tu veux être sûr que le service est prêt (si tu as une logique async avant), utilise ce bloc
    this.authService.isReady$().subscribe(async (ready) => {
      if (ready) {
        this.user = await this.authService.getUserData();
        //console.log('Utilisateur récupéré :', this.user);
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

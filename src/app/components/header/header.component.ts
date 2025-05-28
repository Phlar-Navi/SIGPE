import { Component, OnInit, Input  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HeaderComponent  implements OnInit {
  user: any;
  currentDate = new Date();
  // logoUrl: string = '../../../../assets/images/logo.png'; // URL du logo
  // title: string = 'Gestion de Présence'; // Titre du header
  // subtitle: string = ''; // Sous-titre 'Bienvenue, Dr. Moskolai Justin'
  // profileImageUrl: string = ''; // URL de l'image de profil
  hasNotification: boolean = true;
  // @Input() hasNotification: boolean = true; // Afficher la bulle de notification
  apiUrl = 'http://localhost:8000';

  @Input() logoUrl: string = 'assets/images/logo.png';
  @Input() title: string = 'SIGPE';
  @Input() subtitle: string = 'Tableau de bord administrateur';
  @Input() profileImageUrl: string = 'assets/images/profile-placeholder.png';
  @Input() userName: string = 'Admin User';

  unreadNotifications: number = 3; // À remplacer par un service réel
  unreadMessages: number = 0;
  showProfileMenu: boolean = false;
  showQuickActions: boolean = false;
  
  quickActions = [
    { label: 'Nouvel utilisateur', action: 'createUser' },
    { label: 'Générer rapport', action: 'generateReport' },
    { label: 'Importer données', action: 'importData' }
  ];

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) this.showQuickActions = false;
  }

  toggleQuickActions() {
    this.showQuickActions = !this.showQuickActions;
    if (this.showQuickActions) this.showProfileMenu = false;
  }

  openNotifications() {
    // Implémentez la navigation vers les notifications
    console.log('Ouvrir les notifications');
  }

  openMessages() {
    // Implémentez la navigation vers les messages
    console.log('Ouvrir les messages');
  }

  executeAction(action: any) {
    console.log('Exécuter action:', action);
    this.showQuickActions = false;
  }

  navigateTo(route: string) {
    console.log('Naviguer vers:', route);
    this.showProfileMenu = false;
  }

  logout() {
    console.log('Déconnexion');
  }

  constructor(private authService: AuthService) { }

  ngOnInit() {
    setInterval(() => {
      this.currentDate = new Date();
    }, 1000);
    this.authService.isReady$().subscribe(async (ready) => {
      if (ready) {
        // Récupérer les données de l'utilisateur
        this.user = await this.authService.getUserData();
  
        if (this.user) {
          // Si l'utilisateur existe et les données sont valides
          this.subtitle = `Bienvenue, ${this.user.nom || ''}`;  // Si nom est null ou undefined, on affiche une chaîne vide
          this.profileImageUrl = this.user.photo
            ? `${this.apiUrl}${this.user.photo}`
            : 'assets/images/profil.jpg';
        } else {
          // Si aucune donnée utilisateur n'est trouvée
          this.subtitle = 'Bienvenue !';
          this.profileImageUrl = 'assets/default-profile.png';  // Image par défaut si aucun utilisateur n'est connecté
        }
      }
    });
  }
  

}

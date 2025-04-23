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

  logoUrl: string = '../../../../assets/images/logo.png'; // URL du logo
  title: string = 'Gestion de Présence'; // Titre du header
  subtitle: string = ''; // Sous-titre 'Bienvenue, Dr. Moskolai Justin'
  profileImageUrl: string = ''; // URL de l'image de profil
  hasNotification: boolean = true;
  // @Input() hasNotification: boolean = true; // Afficher la bulle de notification

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.authService.isReady$().subscribe(async (ready) => {
      if (ready) {
        this.user = await this.authService.getUserData();
        this.subtitle = `Bienvenue, ${this.user.full_name}`;
        this.profileImageUrl = `${environment.apiUrl}${this.user.photo_faciale}`;
        // console.log(this.user);
      }
    });
  }

}

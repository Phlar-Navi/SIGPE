import { Component, OnInit, Input  } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HeaderComponent  implements OnInit {
  @Input() logoUrl: string = '../../../../assets/images/logo.png'; // URL du logo
  @Input() title: string = 'Gestion de Présence'; // Titre du header
  @Input() subtitle: string = 'Bienvenue, Dr. Moskolai Justin'; // Sous-titre
  @Input() profileImageUrl: string = '../../../../assets/images/profil.jpg'; // URL de l'image de profil
  @Input() hasNotification: boolean = true; // Afficher la bulle de notification

  constructor() { }

  ngOnInit() {}

}

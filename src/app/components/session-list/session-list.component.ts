import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { SwiperModule } from 'swiper/angular';
// import { SwiperOptions } from 'swiper';

export interface Session {
  id: number;
  title: string;
  date: string; // Format : 'YYYY-MM-DDTHH:MM'
  date_fin: string;
  room: string;
  description: string;
  status: 'À venir' | 'En cours' | 'Terminée';
  teacher: string; // Ajouté pour correspondre à l'interface de SessionListComponent
  students: object[]; // Ajouté pour correspondre à l'interface de SessionListComponent
}

@Component({
  selector: 'app-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SessionListComponent  implements OnInit {

  @Input() sessions: Session[] = []; // Liste des sessions en entrée
  @Output() sessionSelected = new EventEmitter<number>(); // Événement pour sélectionner une session

  // Méthode pour sélectionner une session
  selectSession(sessionId: number) {
    this.sessionSelected.emit(sessionId);
  }
  
  // swiperConfig: SwiperOptions = {
  //   lazy: {
  //     loadPrevNext: true,
  //     loadOnTransitionStart: true,
  //   },
  //   loop: true,
  //   navigation: true,
  //   pagination: { clickable: true },
  // };

  // Méthodes pour les classes CSS (comme précédemment)
  getSessionClass(status: string): string {
    switch (status) {
      case 'À venir':
        return 'bg-gradient-to-b from-green-50 to-green-100 border-b-4 border-green-600';
      case 'En cours':
        return 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-b-4 border-yellow-600';
      case 'Terminée':
        return 'bg-gradient-to-b from-red-50 to-red-100 border-b-4 border-red-600';
      default:
        return 'bg-gray-50 border-b-4 border-gray-600';
    }
  }

  getIconClass(status: string): string {
    switch (status) {
      case 'À venir':
        return 'bg-green-600';
      case 'En cours':
        return 'bg-yellow-600';
      case 'Terminée':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  }

  getIcon(status: string): string {
    switch (status) {
      case 'À venir':
        return 'fas fa-calendar-alt';
      case 'En cours':
        return 'fas fa-chalkboard-teacher';
      case 'Terminée':
        return 'fas fa-check-circle';
      default:
        return 'fas fa-question-circle';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'À venir':
        return 'text-green-700';
      case 'En cours':
        return 'text-yellow-700';
      case 'Terminée':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  }

  constructor() { }

  ngOnInit() {}

}

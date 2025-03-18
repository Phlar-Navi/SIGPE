import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Chart, LinearScale } from 'chart.js/auto';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { SidebarStateService } from 'src/app/services/sidebar-state.service';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.page.html',
  styleUrls: ['./student-dashboard.page.scss'],
  standalone: false,
})
export class StudentDashboardPage implements OnInit {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  isMenuOpen = false; // État du menu (ouvert/fermé)
  isSmallScreen = window.innerWidth < 768; // Détecte si l'écran est petit

  // Écoute les changements de taille de l'écran
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isSmallScreen = window.innerWidth < 768;
    if (!this.isSmallScreen) {
      this.isMenuOpen = true; // Force l'ouverture du menu sur grand écran
    }
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleMenu();
    }
  }

  constructor(public sidebarState: SidebarStateService) { }

  ngOnInit() {
    this.generate_charts();
  }

  generate_charts(){
    // Données de présence et absence
    const presenceData = {
      labels: ["Mathématiques", "Informatique", "Physique", "Chimie", "Biologie"],
      datasets: [{
        label: "Présences",
        data: [80, 75, 90, 85, 70],
        backgroundColor: "#10B981",
      },
      {
        label: "Absences",
        data: [20, 25, 10, 15, 30],
        backgroundColor: "#EF4444",
      }],
    };

    // Graphique en barres
    const canvasElement = document.getElementById(`presenceChart`);

    if (canvasElement){
      const ctx = (canvasElement as HTMLCanvasElement).getContext('2d');
      if(ctx){
        new Chart(ctx, {
          type: "bar",
          data: presenceData,
          options: {
            animation: {
              duration: 1000,
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
              },
            },
          },
        });
      }
    }

    // Données des cours assistés et non assistés
    const courseData = {
      labels: ["Mathématiques", "Informatique", "Physique", "Chimie", "Biologie"],
      datasets: [{
        label: "Cours assistés",
        data: [80, 75, 90, 85, 70],
        borderColor: "#10B981",
        fill: false,
      },
      {
        label: "Cours non assistés",
        data: [20, 25, 10, 15, 30],
        borderColor: "#EF4444",
        fill: false,
      }],
    };

    // Graphique en courbes
    const canvasElement2 = document.getElementById(`courseChart`);

    if(canvasElement2){
      const ctx2 = (canvasElement2 as HTMLCanvasElement).getContext('2d');
      if(ctx2){
        new Chart(ctx2, {
          type: "line",
          data: courseData,
          options: {
            animation: {
              duration: 1000,
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
              },
            },
          },
        });
      }
    }

  }

}

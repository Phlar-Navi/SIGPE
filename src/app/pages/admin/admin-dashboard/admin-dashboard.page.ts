import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: false
})
export class AdminDashboardPage implements OnInit {

  //@ViewChild('sidebar') sidebar!: SidebarComponent;
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

  // toggleSidebar() {
  //   if (this.sidebar) {
  //     this.sidebar.toggleMenu();
  //   }
  // }

  constructor() { }

  ngOnInit() {
    this.generate_charts();
  }

  generate_charts(){
    // Données de présence et absence
    const presenceData = {
      labels: ["Mathématiques", "Informatique", "Physique", "Chimie", "Biologie"],
      datasets: [{
        label: "Taux de présence",
        data: [80, 75, 90, 85, 70],
        backgroundColor: "#10B981",
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

  }

}

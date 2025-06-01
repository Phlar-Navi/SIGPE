import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage-angular';
import { AuthService } from 'src/app/services/auth.service';
import { SessionService } from 'src/app/services/session.service';
import { FormControl } from '@angular/forms';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ImportService } from 'src/app/services/import.service';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.page.html',
  styleUrls: ['./teacher-dashboard.page.scss'],
  standalone: false
})
export class TeacherDashboardPage implements OnInit {

  @ViewChild('sidebar') sidebar!: SidebarComponent;
  isMenuOpen = false; // État du menu (ouvert/fermé)
  isSmallScreen = window.innerWidth < 768; // Détecte si l'écran est petit
  chart: any;
  chart_2: any;
  matiereId = '';
  periode = 'jour';
  matieres_stats: any[] = [];
  matieres: any[] = [];
  matieres_all: any[] = [];
  statsData: any;
  apiUrl = environment.apiUrl;
  statsBySession: any[] = [];
  charts: Chart[] = [];

  students: any[] = [];
  filteredStudents: any[] = [];
  availableSubjects: any[] = [];
  availableFilieres: any[] = [];
  availableNiveaux: any[] = [];

  // Filtres
  searchControl = new FormControl('');
  selectedSubject = '';
  selectedFiliere = '';
  selectedNiveau = '';
  selectedPeriod = 'jour';

  // Filtres de l'hitorique
  selectedSubject_hist = 1;
  selectedFiliere_hist = 1;
  selectedNiveau_hist = 1;
  selectedPeriod_hist = 'jour';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  selectedGlobalFiliere: string = '';
  selectedGlobalNiveau: string = '';
  selectedGlobalPeriod: string = 'semaine'; // par défaut

  statutResult: any = null;
  searchMatricule = '';
  searchMatiereId = '';
  searchDate = '';

  globalStats: any;
  globalPresenceChart: any;

  isLoadingStats: boolean = true;

  // --------------------------------------
  async exportGlobalPresenceReport() {
    // Assurez-vous que le graphique est rendu
    if (!this.globalPresenceChart) {
      this.loadGlobalPresenceChart();
      await new Promise(resolve => setTimeout(resolve, 500)); // Laissez le temps au rendu
    }

    // Capturez les données actuelles
    const chartData = this.globalPresenceChart?.data;

    await this.pdfService.exportGlobalPresenceReport(
      chartData,
      {
        filiere: this.selectedGlobalFiliere,
        niveau: this.selectedGlobalNiveau,
        periode: this.translatePeriode(this.selectedGlobalPeriod)
      },
      this.availableFilieres,
      this.availableNiveaux
    );
  }
  // --------------------------------------
  exportChartAsImage(canvasId: string, filename: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${filename}.png`;
    link.click();
  }

  export() {
    this.exportChartAsPDF('globalPresenceChart', 'Taux de présence', {
      filiere: this.getFiliereLabel(this.selectedGlobalFiliere),
      niveau: this.getNiveauLabel(this.selectedGlobalNiveau),
      periode: this.translatePeriode(this.selectedGlobalPeriod)
    });
  }

  translatePeriode(code: string): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

    const format = (date: Date) => date.toLocaleDateString('fr-FR', options);

    switch (code) {
      case 'jour':
        return `Aujourd'hui (${format(now)})`;

      case 'semaine': {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1); // lundi
        const end = new Date(start);
        end.setDate(start.getDate() + 6); // dimanche
        return `Semaine du ${format(start)} au ${format(end)}`;
      }

      case 'mois': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return `Mois du ${format(start)} au ${format(end)}`;
      }

      case 'semestre': {
        const year = now.getFullYear();
        if (now.getMonth() < 6) {
          return `1er semestre (${format(new Date(year, 8, 1))} - ${format(new Date(year, 1, 28))})`;
        } else {
          return `2e semestre (${format(new Date(year, 2, 1))} - ${format(new Date(year, 7, 31))})`;
        }
      }

      case 'annee': {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return `Année ${now.getFullYear()} (${format(start)} - ${format(end)})`;
      }

      default:
        return 'Toutes périodes';
    }
  }

  async exportStatsToPdf() {
    // Assurez-vous que le graphique est rendu
    if (!this.chart) {
      this.renderCombinedChart(this.globalStats);
      await new Promise(resolve => setTimeout(resolve, 500)); // Laissez le temps au rendu
    }

    await this.pdfService.generateStatsReport(
      this.globalStats,
      this.statsBySession,
      `Statistiques des Sessions - ${new Date().toLocaleDateString()}`
    );
  }

  exportPresenceStatsAsPDF() {
    const block = document.getElementById('chartsContainer');
    if (!block) {
      console.error('Bloc introuvable');
      return;
    }

    html2canvas(block, { scrollY: -window.scrollY }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 40; // marges
      const aspectRatio = canvas.height / canvas.width;
      const imgHeight = imgWidth * aspectRatio;

      // Informations complémentaires (optionnel)
      const periodeLabel = this.translatePeriode(this.periode);
      const matiereLabel = this.getMatiereLabel_stats(this.matiereId);

      pdf.setFontSize(14);
      pdf.text(`Statistiques de présence`, 20, 30);
      if (periodeLabel) pdf.text(`Période : ${periodeLabel}`, 20, 50);
      if (matiereLabel) pdf.text(`Matière : ${matiereLabel}`, 20, 70);

      // Ajouter le graphique
      pdf.addImage(imgData, 'PNG', 20, 90, imgWidth, imgHeight);

      pdf.save('statistiques_presence.pdf');
    });
  }

  exportChartAsPDF(
    canvasId: string,
    filename: string,
    options: {
      filiere?: string;
      niveau?: string;
      matiere?: string;
      periode?: string;
    } = {}
  ) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas introuvable :', canvasId);
      return;
    }

    html2canvas(canvas).then(canvasImage => {
      const imgData = canvasImage.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const margin = 40;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - margin * 2;
      const aspectRatio = canvasImage.height / canvasImage.width;
      const imgHeight = imgWidth * aspectRatio;

      // Ajout d’un titre
      const today = new Date();
      const formattedDate = today.toLocaleDateString();

      let y = 30;
      pdf.setFontSize(14);
      pdf.text(`Export du graphique : ${filename}`, margin, y);

      y += 20;
      if (options.filiere) pdf.text(`Filière : ${options.filiere}`, margin, y);
      if (options.niveau) pdf.text(`Niveau : ${options.niveau}`, margin + 200, y);
      
      y += 20;
      //if (options.matiere) pdf.text(`Matière : ${options.matiere}`, margin, y);
      if (options.periode) pdf.text(`Période : ${options.periode}`, margin + 100, y);

      y += 30;
      pdf.text(`Date d'export : ${formattedDate}`, margin, y);

      // Ajout du graphique en dessous
      y += 20;
      pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);

      // Export
      pdf.save(`${filename.replace(/\s+/g, '_').toLowerCase()}_${formattedDate.replace(/\//g, '-')}.pdf`);
    });
  }

  getFiliereLabel(id: string | number): string {
    const filiere = this.availableFilieres.find(f => f.id == id);
    return filiere ? filiere.nom : 'Inconnue';
  }

  getNiveauLabel(id: string | number): string {
    const niveau = this.availableNiveaux.find(n => n.id == id);
    return niveau ? niveau.nom : 'Inconnu';
  }

  getMatiereLabel(id: string | number): string {
    const matiere = this.matieres.find(m => m.id == id);
    return matiere ? matiere.nom : 'Inconnue';
  }

  getMatiereLabel_stats(id: string | number): string {
    const matiere = this.matieres_stats.find(m => m.id == id);
    return matiere ? matiere.nom : 'Inconnue';
  }

  // exportChartAsPDF(canvasId: string, filename: string) {
  //   const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  //   if (!canvas) {
  //     console.error('Canvas introuvable :', canvasId);
  //     return;
  //   }

  //   html2canvas(canvas).then(canvasImage => {
  //     const imgData = canvasImage.toDataURL('image/png');

  //     const pdf = new jsPDF({
  //       orientation: 'portrait',
  //       unit: 'px',
  //       format: 'a4'
  //     });

  //     const pageWidth = pdf.internal.pageSize.getWidth();
  //     const imgWidth = pageWidth - 40; // marge
  //     const aspectRatio = canvasImage.height / canvasImage.width;
  //     const imgHeight = imgWidth * aspectRatio;

  //     pdf.text(`Graphique : ${filename}`, 20, 30);
  //     pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
  //     pdf.save(`${filename}.pdf`);
  //   });
  // }

  rechercherStatut() {
    if (!this.searchMatricule || !this.searchMatiereId || !this.searchDate) {
      alert("Tous les champs sont requis.");
      return;
    }

    this.sessionService.getStatutEtudiant(this.searchMatricule, Number(this.searchMatiereId), this.searchDate)
      .subscribe({
        next: (data) => this.statutResult = data,
        error: (err) => {
          console.error(err);
          this.statutResult = { error: err.error.message || 'Erreur inconnue' };
        }
      });
  }

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

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private authService: AuthService,
    private sessionService: SessionService,
    private pdfService: ImportService
  ) {}

  async ngOnInit() {
    await this.loadTeacherData();
    this.getMatieres();
    this.loadData();
    this.sessionService.getFilieresByEnseignant(await this.authService.getUsersId()).subscribe({
      next: (filieres) => {
        this.availableFilieres = filieres;
        this.loadGlobalPresenceChart(); // ✅ appelé une fois les filtres disponibles
      }
    });

    this.sessionService.getNiveauxByEnseignant(await this.authService.getUsersId()).subscribe({
      next: (niveaux) => {
        this.availableNiveaux = niveaux;
      }
    });

    const teacherId = await this.authService.getUsersId();
  
    this.sessionService.getTeacherSubjects(teacherId).subscribe({
      next: (data) => {
        this.matieres_all = data;
        this.matieres_stats = data
      },
      error: (err) => {
        console.error('Erreur récupération matières :', err);
      }
    });
  }

  async loadTeacherData() {
    const user = await this.authService.getUserData();
    if (user) {
      this.getPresenceStats();
    }
  }

  getPresenceStats() {
    const params: any = {};
    if (this.periode) params.periode = this.periode;
    if (this.matiereId) params.matiere_id = this.matiereId;

    this.http.get(`${this.apiUrl}teacher/presence-stats`, { params })
      .subscribe({
        next: (sessions: any) => {
          this.statsBySession = sessions;
          
          // Calcul des totaux globaux
          const globalStats = {
            present: sessions.reduce((sum: number, session: any) => sum + session.present_count, 0),
            absent: sessions.reduce((sum: number, session: any) => sum + session.absent_count, 0),
            late: sessions.reduce((sum: number, session: any) => sum + session.late_count, 0),
            excused: sessions.reduce((sum: number, session: any) => sum + session.excused_count, 0),
            totalSessions: sessions.length
          };
          this.globalStats = globalStats;
          this.renderCombinedChart(globalStats);
          this.isLoadingStats = false;
        },
        error: (err) => {
          console.error('Erreur stats présence', err);
          this.isLoadingStats = false;
        }
      });
  }

  renderCombinedChart(globalStats: any) {
    const container = document.getElementById('chartsContainer');
    if (container) container.innerHTML = '';

    if (this.chart) {
      this.chart.destroy();
    }

    // Création d'un conteneur spécifique pour le camembert avec une taille fixe
    const chartContainer = document.createElement('div');
    chartContainer.style.width = '100%';
    chartContainer.style.maxWidth = '500px'; // Limite la largeur maximale
    chartContainer.style.margin = '0 auto'; // Centrer le graphique
    chartContainer.style.position = 'relative';
    chartContainer.style.height = '400px'; // Hauteur fixe
    
    container?.appendChild(chartContainer);

    const canvas = document.createElement('canvas');
    canvas.id = 'combinedChart';
    chartContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Création du graphique en camembert
    this.chart = new Chart(ctx, {
      type: 'pie', // Changé de 'bar' à 'pie'
      data: {
        labels: ['Présent', 'Absent', 'En retard', 'Excusé'],
        datasets: [{
          label: 'Nombre total',
          data: [
            globalStats.present,
            globalStats.absent,
            globalStats.late,
            globalStats.excused
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Désactive le maintien de l'aspect ratio
        backgroundColor: 'white',
        plugins: {
          title: {
            display: true,
            text: `Statistiques globales (${globalStats.totalSessions} sessions)`,
            font: {
              size: 16
            }
          },
          legend: {
            position: 'right', // Positionne la légende à droite
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const data = context.dataset.data as number[];
                const total = data.reduce((a: number, b: number) => a + b, 0);
                const value = context.raw as number;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
        // Pas besoin de scales pour un pie chart
      }
    });

    // Ajouter un tableau récapitulatif des sessions (inchangé)
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'bg-white p-4 rounded-lg shadow-md mt-6';
    summaryDiv.innerHTML = `
      <h3 class="text-lg font-semibold mb-3">Détail par session</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 text-left">Matière</th>
              <th class="p-2 text-left">Date</th>
              <th class="p-2 text-left">Présents</th>
              <th class="p-2 text-left">Absents</th>
              <th class="p-2 text-left">Retards</th>
              <th class="p-2 text-left">Excusés</th>
            </tr>
          </thead>
          <tbody>
            ${this.statsBySession.map(session => `
              <tr class="border-b">
                <td class="p-2">${session.matiere?.nom || 'Inconnu'}</td>
                <td class="p-2">${new Date(session.heure_debut).toLocaleString()}</td>
                <td class="p-2">${session.present_count}</td>
                <td class="p-2">${session.absent_count}</td>
                <td class="p-2">${session.late_count}</td>
                <td class="p-2">${session.excused_count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container?.appendChild(summaryDiv);
  }

  onFilterChange() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    this.isLoadingStats = true;

    setTimeout(() => {
      this.getPresenceStats();
    });
  }


  // onFilterChange() {
  //   // Détruire l'ancien graphique
  //   if (this.chart) {
  //     this.chart.destroy();
  //     this.chart = null;
  //     this.isLoadingStats = true;
  //   }
  //   // Recharger les données
  //   this.getPresenceStats();
  // }

  async loadAssiduite() {
    const enseignantId = await this.authService.getUsersId();

    const filters = {
      matiere_id: this.selectedSubject_hist,
      filiere_id: this.selectedFiliere_hist,
      niveau_id: this.selectedNiveau_hist,
      periode: this.selectedPeriod_hist
    };

    this.sessionService.getAssiduiteParEtudiant(enseignantId, filters).subscribe({
      next: (data) => {
        this.students = data;
        this.filterStudents();
      },
      error: (err) => {
        console.error('Erreur chargement assiduité', err);
      }
    });
  }

  filterStudents() {
    const search = this.searchControl.value?.toLowerCase() || '';
    this.filteredStudents = this.students.filter(s =>
      s.matricule.toLowerCase().includes(search)
    ).sort((a, b) => b.taux - a.taux);
  }

  async loadData() {
    const teacherId = await this.authService.getUsersId();

    this.sessionService.getFilieresByEnseignant(teacherId).subscribe({
      next: (filieres) => this.availableFilieres = filieres,
      error: (err) => console.error('Erreur chargement filières', err)
    });

    this.sessionService.getNiveauxByEnseignant(teacherId).subscribe({
      next: (niveaux) => this.availableNiveaux = niveaux,
      error: (err) => console.error('Erreur chargement niveaux', err)
    });

  }

  async getMatieres() {
    if (!this.selectedFiliere_hist || !this.selectedNiveau_hist) {
      this.matieres = [];
      return;
    }

    const teacherId = await this.authService.getUsersId();

    this.sessionService.getMatieresByEnseignantAndFilters(
      teacherId,
      this.selectedNiveau_hist,
      this.selectedFiliere_hist
    ).subscribe({
      next: (matieres) => this.matieres = matieres,
      error: (err) => console.error('Erreur chargement matières', err)
    });
  }

// Statistiques par rapport à une filière et/ou un niveau 
  loadGlobalPresenceChart() {
    this.sessionService.getGlobalPresenceStats(
      this.selectedGlobalPeriod,
      this.selectedGlobalFiliere ? Number(this.selectedGlobalFiliere) : undefined,
      this.selectedGlobalNiveau ? Number(this.selectedGlobalNiveau) : undefined
    ).subscribe(data => {
      this.globalPresenceChart = data;
      this.renderGlobalChart(data);
    });
  }


  // renderGlobalChart(stats: any) {
  //   const canvas = document.getElementById('globalPresenceChart') as HTMLCanvasElement;
  //   if (!canvas) return;

  //   const ctx = canvas.getContext('2d');
  //   if (!ctx) return;

  //   if (this.chart_2) this.chart_2.destroy(); // destroy previous if exists

  //   this.chart_2 = new Chart(ctx, {
  //     type: 'doughnut',
  //     data: {
  //       labels: ['Présent', 'Absent', 'En retard', 'Excusé'],
  //       datasets: [{
  //         data: [stats.present, stats.absent, stats.en_retard, stats.excuse],
  //         backgroundColor: [
  //           'rgba(75, 192, 192, 0.7)',
  //           'rgba(255, 99, 132, 0.7)',
  //           'rgba(255, 206, 86, 0.7)',
  //           'rgba(153, 102, 255, 0.7)'
  //         ],
  //         borderWidth: 1
  //       }]
  //     },
  //     options: {
  //       responsive: true,
  //       plugins: {
  //         title: {
  //           display: true,
  //           text: 'Taux de présence global'
  //         },
  //         legend: {
  //           position: 'bottom'
  //         },
  //         tooltip: {
  //           callbacks: {
  //             label: (context) => {
  //               const total = context.dataset.data.reduce((a, b) => a + b, 0);
  //               const value = context.raw as number;
  //               const percentage = Math.round((value / total) * 100);
  //               return `${context.label}: ${value} (${percentage}%)`;
  //             }
  //           }
  //         }
  //       }
  //     }
  //   });
  // }


  renderGlobalChart(stats: any) {
    const canvas = document.getElementById('globalPresenceChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chart_2) this.chart_2.destroy(); // Détruire l'ancien

    this.chart_2 = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Présent', 'Absent', 'En retard', 'Excusé'],
        datasets: [{
          label: 'Nombre d\'étudiants',
          data: [stats.present, stats.absent, stats.en_retard, stats.excuse],
          backgroundColor: [
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        backgroundColor: 'white',
        plugins: {
          title: {
            display: true,
            text: 'Taux de présence global'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const data = context.dataset.data as number[];
                const total = data.reduce((a, b) => (a ?? 0) + (b ?? 0), 0); // sécurité en cas de null
                const value = context.raw as number;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          },
          legend: {
            display: false // Pas nécessaire pour bar simple
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Effectif'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Statut'
            }
          }
        }
      }
    });
  }


}

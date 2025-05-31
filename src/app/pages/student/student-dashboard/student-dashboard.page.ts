import { Component, HostListener, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Chart, LinearScale } from 'chart.js/auto';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { SidebarStateService } from 'src/app/services/sidebar-state.service';
import { HttpClient } from '@angular/common/http';
import { SessionService } from 'src/app/services/session.service';
import { Storage } from '@ionic/storage-angular';
import { Matiere } from 'src/app/services/metadata.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth.service';
import { Session_Laravel } from '../../teacher/teacher-course/teacher-course.page';
import { DatePipe } from '@angular/common';

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
  periode = '';
  matiereId = '';
  etudiantId!: number | null; // à remplacer par l'ID réel connecté
  totalPresences = 0;
  matieres: any[] = [];
  chart: any;
  apiUrl = environment.apiUrl;
  allPresences: any[] = [];
  totalSessions: any;
  tauxPresence = 0;
  allSessions!: any[];
  totalExcused = 0;
  attendanceBySubject: any[] = [];
  excusedRate = 0;

  // Section historique des présences
  historyPeriode = '';
  historyMatiereId = '';
  searchTerm = '';
  filteredHistory: any[] = [];

  // Clés (variables) de storage
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    USER_DATA: 'user_data',
    USER_TYPE: 'type_utilisateur'
  };

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

  async ngAfterViewInit() {
    this.attendanceBySubject = this.calculateAttendanceBySubject();
    const user = await this.storage.get(this.STORAGE_KEYS.USER_DATA);
    this.etudiantId = user.id;
    const niveau = user.niveau_id;
    const filiere = user.filiere_id;

    // Charger les sessions d'abord
    this.sessionService.getSessionsByNiveauAndFiliere(niveau, filiere).subscribe(sessions => {
      this.allSessions = sessions;

      // Puis charger les présences
      if (this.etudiantId) {
        this.sessionService.getPresencesByEtudiant(this.etudiantId).subscribe(data => {
          this.allPresences = data;
          this.filteredHistory = [...data]; // Initialise l'historique
          this.updateStats();
        });
      }
    });
    this.getPresences();
  }

  getPresences() {
    if (this.etudiantId) {
      this.sessionService.getPresencesByEtudiant(this.etudiantId).subscribe(data => {
        this.allPresences = data;
        this.updateStats();
      });
    }
  }

  updateStats() {
    const filteredSessions = this.filterSessions(this.allSessions);
    this.totalSessions = filteredSessions.length;

    // Présences seulement (sans excusés)
    const filteredPresences = this.filterPresences(this.allPresences);
    this.totalPresences = filteredPresences.length;

    // Excusés seulement
    const filteredExcused = this.filterExcused(this.allPresences);
    this.totalExcused = filteredExcused.length;

    // Calcul taux de présence (présents seulement / total sessions)
    this.tauxPresence = this.totalSessions > 0 
        ? Math.round((this.totalPresences / this.totalSessions) * 100)
        : 0;

    // Calcul taux d'excuses (excusés seulement / total sessions)
    this.excusedRate = this.totalSessions > 0
        ? Math.round((this.totalExcused / this.totalSessions) * 100)
        : 0;

    // Mise à jour des stats par matière
    this.attendanceBySubject = this.calculateAttendanceBySubject();

    // Préparation des données pour le graphique
    const chartData = this.prepareChartData(filteredSessions, filteredPresences, filteredExcused);
    this.renderChart(chartData.labels, 
                   chartData.sessionValues, 
                   chartData.presenceValues, 
                   chartData.excusedValues);
  }

  prepareChartData(sessions: any[], presences: any[], excused: any[]) {
    // Groupements par date
    const sessionsByDate: { [key: string]: number } = {};
    const presencesByDate: { [key: string]: number } = {};
    const excusedByDate: { [key: string]: number } = {};

    sessions.forEach(session => {
        const date = new Date(session.heure_debut).toLocaleDateString();
        sessionsByDate[date] = (sessionsByDate[date] || 0) + 1;
    });

    presences.forEach(presence => {
        const date = new Date(presence.session.heure_debut).toLocaleDateString();
        presencesByDate[date] = (presencesByDate[date] || 0) + 1;
    });

    excused.forEach(item => {
        const date = new Date(item.session.heure_debut).toLocaleDateString();
        excusedByDate[date] = (excusedByDate[date] || 0) + 1;
    });

    // Fusionner toutes les dates
    const allDates = [...new Set([
        ...Object.keys(sessionsByDate),
        ...Object.keys(presencesByDate),
        ...Object.keys(excusedByDate)
    ])].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return {
        labels: allDates,
        sessionValues: allDates.map(date => sessionsByDate[date] || 0),
        presenceValues: allDates.map(date => presencesByDate[date] || 0),
        excusedValues: allDates.map(date => excusedByDate[date] || 0)
    };
  }

  filterPresences(presences: any[]) {
    return presences.filter(p => {
        const session = p.session;
        const matiereMatch = !this.matiereId || session.matiere_id == this.matiereId;
        const statutPresent = p.statut.toLowerCase() === 'present' || 
                             p.statut.toLowerCase() === 'pr\u00e9sent';
        const date = new Date(session.heure_debut);

        let periodeMatch = true;
        if (this.periode) {
            periodeMatch = this.checkPeriodMatch(date, this.periode);
        }

        return statutPresent && matiereMatch && periodeMatch;
    });
  }

  filterSessions(sessions: any[]) {
    return sessions.filter(session => {
      const date = new Date(session.heure_debut);

      const matiereMatch = !this.matiereId || session.matiere_id == this.matiereId;

      let periodeMatch = true;
      if (this.periode) {
        const now = new Date();
        switch (this.periode) {
          case 'jour':
            periodeMatch = date.toDateString() === now.toDateString();
            break;
          case 'semaine': {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            periodeMatch = date >= start && date <= end;
            break;
          }
          case 'mois':
            periodeMatch = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            break;
          case 'semestre':
            const mois = now.getMonth() + 1;
            if (mois <= 6) {
              periodeMatch = date.getMonth() < 6 && date.getFullYear() === now.getFullYear();
            } else {
              periodeMatch = date.getMonth() >= 6 && date.getFullYear() === now.getFullYear();
            }
            break;
          case 'annee':
            periodeMatch = date.getFullYear() === now.getFullYear();
            break;
        }
      }

      return matiereMatch && periodeMatch;
    });
  }

  filterExcused(presences: any[]) {
    return presences.filter(p => {
        const session = p.session;
        const matiereMatch = !this.matiereId || session.matiere_id == this.matiereId;
        const statutExcused = p.statut.toLowerCase() === 'excus\u00e9';
        const date = new Date(session.heure_debut);

        let periodeMatch = true;
        if (this.periode) {
            periodeMatch = this.checkPeriodMatch(date, this.periode);
        }

        return statutExcused && matiereMatch && periodeMatch;
    });
  }

  renderChart(labels: string[], sessionData: number[], presenceData: number[], excusedData: number[]) {
    if (this.chart) {
        this.chart.destroy();
    }

    const canvas = document.getElementById('presenceChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    this.chart = new Chart(ctx!, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sessions totales',
                    data: sessionData,
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Présences',
                    data: presenceData,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Excusés',
                    data: excusedData,
                    backgroundColor: 'rgba(245, 158, 11, 0.7)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre de sessions'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Dates'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterLabel: (context) => {
                            const datasetIndex = context.datasetIndex;
                            const labelIndex = context.dataIndex;
                            const total = sessionData[labelIndex];
                            
                            if (datasetIndex === 1) { // Présences
                                const presence = presenceData[labelIndex];
                                const rate = total > 0 ? Math.round((presence / total) * 100) : 0;
                                return `Taux présence: ${rate}%`;
                            }
                            else if (datasetIndex === 2) { // Excusés
                                const excused = excusedData[labelIndex];
                                const rate = total > 0 ? Math.round((excused / total) * 100) : 0;
                                return `Taux excusés: ${rate}%`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
  }

  getMatieres() {
    this.storage.get(this.STORAGE_KEYS.USER_DATA).then(user => {
      const filiere = user.filiere_id;
      const niveau = user.niveau_id;

      this.sessionService.getMatieresByFiliereAndNiveau(niveau, filiere)
          .subscribe({
            next: (matieres) => {
              this.matieres = matieres;
            },
            error: (err) => {
              console.error('Erreur lors de la récupération des matières', err);
            }
          });
      });
  }

  getSessions() {
    this.storage.get(this.STORAGE_KEYS.USER_DATA).then(user => {
      const filiere = user.filiere_id;
      const niveau = user.niveau_id;

      this.sessionService.getSessionsByNiveauAndFiliere(niveau, filiere)
          .subscribe({
            next: (sessions) => {
              this.allSessions = sessions;
            },
            error: (err) => {
              console.error('Erreur lors de la récupération des matières', err);
            }
          });
      });
  }

  filterHistory() {
    // On commence avec toutes les présences
    let result = [...this.allPresences];

    // Filtre par matière si sélectionnée
    if (this.historyMatiereId) {
      result = result.filter(p => p.session.matiere_id == this.historyMatiereId);
    }

    // Filtre par période si sélectionnée
    if (this.historyPeriode) {
      result = result.filter(p => {
        const date = new Date(p.session.heure_debut);
        return this.checkPeriodMatch(date, this.historyPeriode);
      });
    }

    // Filtre par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p => {
        return (
          p.session.matiere?.code?.toLowerCase().includes(term) ||
          p.session.matiere?.nom?.toLowerCase().includes(term) ||
          p.session.heure_debut.toLowerCase().includes(term)
        );
      });
    }

    this.filteredHistory = result;
  }

  constructor(public sidebarState: SidebarStateService, 
    private http: HttpClient,
    private sessionService: SessionService,
    private storage: Storage,
    private authService: AuthService) { }

  async ngOnInit() {
    this.etudiantId = await this.authService.getUserId();
    this.getMatieres();
    this.getSessions();
  }
  // Méthode helper pour vérifier la période
  private checkPeriodMatch(date: Date, periode: string): boolean {
      const now = new Date();
      switch (periode) {
          case 'jour':
              return date.toDateString() === now.toDateString();
          case 'semaine': {
              const start = new Date(now);
              start.setDate(now.getDate() - now.getDay());
              const end = new Date(start);
              end.setDate(start.getDate() + 6);
              return date >= start && date <= end;
          }
          case 'mois':
              return date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
          case 'semestre':
              const mois = now.getMonth() + 1;
              if (mois <= 6) {
                  return date.getMonth() < 6 && 
                        date.getFullYear() === now.getFullYear();
              } else {
                  return date.getMonth() >= 6 && 
                        date.getFullYear() === now.getFullYear();
              }
          case 'annee':
              return date.getFullYear() === now.getFullYear();
          default:
              return true;
      }
  }
  getStatusText(status: string): string {
    const statut = status.toLowerCase();
    if (statut === 'present' || statut === 'pr\u00e9sent') return 'Présent';
    if (statut === 'excus\u00e9') return 'Excusé';
    if (statut === 'absent') return 'Absent';
    return status; // Au cas où il y aurait d'autres statuts
  }
  calculateAttendanceBySubject() {
    const attendanceBySubject: { 
      matiere: string, 
      totalSessions: number, 
      presences: number,
      excused: number,
      participationRate: number  // Présents + Excusés
    }[] = [];

    this.matieres.forEach(matiere => {
      const sessionsForSubject = this.allSessions.filter(s => s.matiere_id === matiere.id);
      const totalSessions = sessionsForSubject.length;

      const presencesForSubject = this.allPresences.filter(p => 
        p.session.matiere_id === matiere.id && 
        (p.statut.toLowerCase() === 'present' || p.statut.toLowerCase() === 'pr\u00e9sent')
      );
      const presences = presencesForSubject.length;

      const excusedForSubject = this.allPresences.filter(p => 
        p.session.matiere_id === matiere.id && 
        p.statut.toLowerCase() === 'excus\u00e9'
      );
      const excused = excusedForSubject.length;

      const participationRate = totalSessions > 0 
        ? Math.round(((presences + excused) / totalSessions) * 100) 
        : 0;

      attendanceBySubject.push({
        matiere: matiere.nom,
        totalSessions,
        presences,
        excused,
        participationRate
      });
    });

    return attendanceBySubject;
  }
}

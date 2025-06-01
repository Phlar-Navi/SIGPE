import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private apiBaseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  importExcel(file: File, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('type', type);

    const endpointMap: {[key: string]: string} = {
      'etudiant': '/EtudiantsImport',
      'enseignant': '/EnseignantsImport',
      'salle': '/SalleImport',
      'matiere': '/MatiereImport',
      'niveau': '/NiveauImport',
      'filiere': '/FiliereImport'
    };

    const endpoint = endpointMap[type.toLowerCase()] || '/import-default';
    return this.http.post(`${this.apiBaseUrl}${endpoint}`, formData);
  }

  // ----------------------------------------------------------------------------------------------------
  generateSessionReport(
    session: any,
    students: any[],
    chartImage?: string
  ): void {
    const doc = new jsPDF();
    const margin = 15;
    let yPos = 20;

    // Titre principal
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('Rapport de Session', margin, yPos);
    yPos += 10;

    // Informations de la session
    doc.setFontSize(12);
    this.addSessionDetails(doc, session, margin, yPos);
    yPos += 60;

    // Tableau des étudiants
    this.addStudentsTable(doc, students, margin, yPos);
    yPos += 10 + (students.length * 10);

    // Graphique (si disponible)
    if (chartImage) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Statistiques de Présence', margin, 20);
      doc.addImage(chartImage, 'JPEG', margin, 30, 180, 100);
    }

    // Pied de page
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Généré le ${new Date().toLocaleDateString()} - SIGPE`, 
      margin, 
      doc.internal.pageSize.height - 10
    );

    doc.save(`rapport_session_${session.id}.pdf`);
  }

  private addSessionDetails(doc: jsPDF, session: any, x: number, y: number): void {
    const details = [
      ['Matière', `${session.matiere?.code} - ${session.matiere?.nom}`],
      ['Salle', session.salle?.nom],
      ['Date', session.date],
      ['Heure', `${session.heure_debut} - ${session.heure_fin}`],
      ['Enseignant', session.enseignant?.nom],
      ['Statut', session.statut]
    ];

    autoTable(doc, {
      startY: y,
      head: [['Détail', 'Valeur']],
      body: details,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: x }
    });
  }

  private addStudentsTable(doc: jsPDF, students: any[], x: number, y: number): void {
    const studentData = students.map(s => [
      s.etudiant.nom,
      s.etudiant.matricule,
      s.statut === 'présent' ? 'Présent' : s.statut === 'En retard' ? 'Retard' : 'Absent'
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Nom', 'Matricule', 'Statut']],
      body: studentData,
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: x }
    });
  }

  // ---------------------------------------------------------------------------------------------
  async generateStatsReport(
    globalStats: any,
    statsBySession: any[],
    title: string = 'Rapport Statistique Global'
  ): Promise<void> {
    const doc = new jsPDF('landscape');
    const margin = 15;
    let yPos = 20;

    // Titre principal
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, margin, yPos);
    yPos += 10;

    // Statistiques globales
    doc.setFontSize(14);
    doc.text('Aperçu Global', margin, yPos);
    yPos += 10;

    // Capture du graphique
    const chartImage = await this.captureChart('combinedChart');
    if (chartImage) {
      doc.addImage(chartImage, 'JPEG', margin, yPos, 180, 120);
      yPos += 130;
    }

    // Tableau récapitulatif
    this.addSessionStatsTable(doc, globalStats, margin, yPos);
    yPos += 30;

    // Détail par session
    doc.addPage('landscape');
    doc.setFontSize(14);
    doc.text('Détail par Session', margin, 20);
    this.addDetailedSessionsTable(doc, statsBySession, margin, 30);

    // Pied de page
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Généré le ${new Date().toLocaleDateString()} - SIGPE`, 
      margin, 
      doc.internal.pageSize.height - 10
    );

    doc.save(`rapport_statistiques_${new Date().getTime()}.pdf`);
  }

  // pdf.service.ts
private async captureChart(chartId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    if (!canvas) {
      resolve(null);
      return;
    }

    // Créez un canvas temporaire avec fond blanc
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    
    if (!ctx) {
      resolve(null);
      return;
    }

    // Remplissez le fond en blanc
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Copiez le contenu du canvas original
    ctx.drawImage(canvas, 0, 0);

    // Convertissez en image
    tempCanvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.95);
  });
}

  // private async captureChart(chartId: string): Promise<string | null> {
  //   return new Promise((resolve) => {
  //     const canvas = document.getElementById(chartId) as HTMLCanvasElement;
  //     if (!canvas) {
  //       resolve(null);
  //       return;
  //     }

  //     canvas.toBlob((blob) => {
  //       if (!blob) {
  //         resolve(null);
  //         return;
  //       }
  //       const reader = new FileReader();
  //       reader.onload = () => resolve(reader.result as string);
  //       reader.readAsDataURL(blob);
  //     }, 'image/jpeg', 0.95);
  //   });
  // }

  private addSessionStatsTable(doc: jsPDF, stats: any, x: number, y: number): void {
    const total = stats.present + stats.absent + stats.late + stats.excused;
    const percentages = {
      present: total > 0 ? Math.round((stats.present / total) * 100) : 0,
      absent: total > 0 ? Math.round((stats.absent / total) * 100) : 0,
      late: total > 0 ? Math.round((stats.late / total) * 100) : 0,
      excused: total > 0 ? Math.round((stats.excused / total) * 100) : 0
    };

    autoTable(doc, {
      startY: y,
      head: [['Statut', 'Nombre', 'Pourcentage']],
      body: [
        ['Présents', stats.present, `${percentages.present}%`],
        ['Absents', stats.absent, `${percentages.absent}%`],
        ['Retards', stats.late, `${percentages.late}%`],
        ['Excusés', stats.excused, `${percentages.excused}%`],
        ['Total', total, '100%']
      ],
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: x },
      theme: 'grid'
    });
  }

  private addDetailedSessionsTable(doc: jsPDF, sessions: any[], x: number, y: number): void {
    const sessionData = sessions.map(session => ({
      matiere: session.matiere?.nom || 'Inconnu',
      date: new Date(session.heure_debut).toLocaleDateString(),
      present: session.present_count,
      absent: session.absent_count,
      late: session.late_count,
      excused: session.excused_count
    }));

    autoTable(doc, {
      startY: y,
      head: [['Matière', 'Date', 'Présents', 'Absents', 'Retards', 'Excusés']],
      body: sessionData.map(s => [
        s.matiere,
        s.date,
        s.present,
        s.absent,
        s.late,
        s.excused
      ]),
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: x },
      theme: 'grid',
      styles: { fontSize: 8 } // Taille réduite pour plus de données
    });
  }

  // ----------------------------------------------------------------------------------
  async exportGlobalPresenceReport(
    chartData: any,
    filters: {
      filiere: string,
      niveau: string,
      periode: string
    },
    filieres: any[],
    niveaux: any[]
  ): Promise<void> {
    const doc = new jsPDF();
    const margin = 15;
    let yPos = 20;

    // Titre principal
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('Rapport Taux de Présence Global', margin, yPos);
    yPos += 10;

    // Filtres appliqués
    doc.setFontSize(12);
    this.addFiltersSection(doc, filters, filieres, niveaux, margin, yPos);
    yPos += 40;

    // Capture du graphique
    const chartImage = await this.captureChart('globalPresenceChart');
    if (chartImage) {
      doc.addImage(chartImage, 'JPEG', margin, yPos, 180, 120);
      yPos += 130;
    }

    // Statistiques détaillées
    this.addPresenceStats(doc, chartData, margin, yPos);

    // Pied de page
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Généré le ${new Date().toLocaleDateString()} - SIGPE`, 
      margin, 
      doc.internal.pageSize.height - 10
    );

    doc.save(`taux_presence_global_${new Date().getTime()}.pdf`);
  }

  private addFiltersSection(
    doc: jsPDF,
    filters: any,
    filieres: any[],
    niveaux: any[],
    x: number,
    y: number
  ): void {
    const filiereText = filters.filiere 
      ? filieres.find(f => f.id == filters.filiere)?.nom 
      : 'Toutes filières';
    
    const niveauText = filters.niveau 
      ? niveaux.find(n => n.id == filters.niveau)?.nom 
      : 'Tous niveaux';

    const periodeText = this.getPeriodLabel(filters.periode);

    autoTable(doc, {
      startY: y,
      head: [['Filtres Appliqués', 'Valeur']],
      body: [
        ['Filière', filiereText],
        ['Niveau', niveauText],
        ['Période', periodeText]
      ],
      headStyles: { fillColor: [63, 81, 181] },
      margin: { left: x },
      theme: 'grid'
    });
  }

  private getPeriodLabel(period: string): string {
    const periods: {[key: string]: string} = {
      'jour': "Aujourd'hui",
      'semaine': 'Cette semaine',
      'mois': 'Ce mois',
      'semestre': 'Ce semestre',
      'annee': 'Cette année',
      'all': 'Toutes périodes'
    };
    return periods[period] || period;
  }

  private addPresenceStats(doc: jsPDF, chartData: any, x: number, y: number): void {
    if (!chartData?.datasets?.length) return;

    const data = chartData.datasets[0].data;
    const labels = chartData.labels;
    const total = data.reduce((sum: number, val: number) => sum + val, 0);

    const stats = labels.map((label: string, i: number) => ({
      label,
      count: data[i],
      percentage: total > 0 ? Math.round((data[i] / total) * 100) : 0
    }));

    autoTable(doc, {
      startY: y,
      head: [['Statut', 'Nombre', 'Pourcentage']],
      body: stats.map((stat: { label: any; count: any; percentage: any; }) => [
        stat.label,
        stat.count,
        `${stat.percentage}%`
      ]),
      headStyles: { fillColor: [63, 81, 181] },
      margin: { left: x },
      theme: 'grid'
    });
  }
  
}

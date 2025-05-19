import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import Chart from 'chart.js/auto';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { FormBuilder } from '@angular/forms';
import { NgControl } from '@angular/forms';
import { ImportService } from 'src/app/services/import.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: false
})
export class AdminDashboardPage implements OnInit {
  profileForm!: FormGroup;
  destination: string = 'etudiant';
  fichier: File | null = null;
  isLoading = false;
  isMenuOpen = false;
  isSmallScreen = window.innerWidth < 768;
  types = ['etudiant', 'enseignant', 'salle', 'matiere', 'niveau', 'filiere'];

  // Écoute les changements de taille de l'écran
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isSmallScreen = window.innerWidth < 768;
    if (!this.isSmallScreen) {
      this.isMenuOpen = true;
    }
  }

  constructor(private fb: FormBuilder, private importService: ImportService) { }

  ngOnInit() {
    this.generate_charts();
    this.profileForm = new FormGroup({
      fichier: new FormControl(null, Validators.required),
      destination: new FormControl(null, Validators.required)
    })
  }


  onSubmit(form: NgForm) {
    if (!form.valid || !this.fichier) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    this.isLoading = true;

    this.importService.importExcel(this.fichier, this.destination).subscribe({
      next: (response) => {
        alert('Importation réussie !');
        form.resetForm();
        this.fichier = null;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        alert(`Erreur lors de l'importation: ${err.message || 'Erreur inconnue'}`);
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (file && validTypes.includes(file.type)) {
      this.fichier = file;
    } else {
      alert('Seuls les fichiers .csv ou .xlsx sont autorisés.');
      event.target.value = '';
    }
  }

  generate_charts(){
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

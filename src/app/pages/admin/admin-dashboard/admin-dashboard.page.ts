import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { FormBuilder } from '@angular/forms';
import { NgControl } from '@angular/forms';
import { ImportService } from 'src/app/services/import.service';
import { AdminService } from 'src/app/services/admin.service';

interface FormConfig {
  [key: string]: any[];
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: false
})
export class AdminDashboardPage implements OnInit {

  models = [
    { name: 'salles', label: 'Salles' },
    { name: 'enseignants', label: 'Enseignants' },
    { name: 'etudiants', label: 'Étudiants' },
    { name: 'filieres', label: 'Filières' },
    { name: 'niveaux', label: 'Niveaux' },
    { name: 'matieres', label: 'Matières' }
  ];

  selectedModel: string = 'salles';
  items: any[] = [];
  currentPage = 1;
  totalPages = 1;
  itemForm!: FormGroup;
  isEditing = false;
  currentItemId: number | null = null;

  // Pour la gestion des relations enseignant
  selectedTeacher: any = null;
  availableFilieres: any[] = [];
  availableNiveaux: any[] = [];
  availableMatieres: any[] = [];

  // Là depuis 
  profileForm!: FormGroup;
  destination: string = 'etudiant';
  fichier: File | null = null;
  isLoading = false;
  isMenuOpen = false;
  isSmallScreen = window.innerWidth < 768;
  types = ['etudiant', 'enseignant', 'salle', 'matiere', 'niveau', 'filiere'];

  // Ajoutez ces propriétés
  statsChart: any;
  filterForm!: FormGroup;
  statsData: any = null;
  chartCanvas: any;
  teachers!: any[];

  // Écoute les changements de taille de l'écran
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isSmallScreen = window.innerWidth < 768;
    if (!this.isSmallScreen) {
      this.isMenuOpen = true;
    }
  }

  constructor(private fb: FormBuilder, 
    private importService: ImportService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) { 
    this.itemForm = this.fb.group({
      // Les champs seront dynamiquement générés
    });
  }

  // ngAfterViewInit() {
  //   this.renderChart();
  // }

  ngOnInit() {
    this.loadItems();
    // this.generate_charts();
    this.profileForm = new FormGroup({
      fichier: new FormControl(null, Validators.required),
      destination: new FormControl(null, Validators.required)
    });
    this.initFilterForm();
    this.generateUsageChart();

    this.adminService.getAllTeachers()
    .subscribe(data => {
      this.teachers = data;
    });
  }

  // Statistiques globaux par critères --------------------------------------------------------------------
  initFilterForm() {
    this.filterForm = this.fb.group({
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      enseignant_id: [''],
      etudiant_id: [''],
      salle_id: [''],
      filiere_id: [''],
      niveau_id: ['']
    });
  }

  loadStats() {
    if (this.filterForm.invalid) return;

    this.adminService.getAttendanceStats(this.filterForm.value)
      .subscribe(data => {
        this.statsData = data;

        // Forcer la détection du changement pour rendre le DOM
        this.cdr.detectChanges();

        // Attendre un tick pour que le canvas soit bien dans le DOM
        setTimeout(() => {
          this.renderChart();
        }, 0);
      });
  }

  // loadStats() {
  //   if (this.filterForm.invalid) return;

  //   this.adminService.getAttendanceStats(this.filterForm.value)
  //     .subscribe(data => {
  //       this.statsData = data;
  //       this.renderChart();
  //     });
  // }

  renderChart() {
    if (this.statsChart) {
      this.statsChart.destroy();
    }

    const ctx = document.getElementById('statsChart') as HTMLCanvasElement;
    this.chartCanvas = ctx.getContext('2d');

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Présent', 'Absent', 'En retard', 'Excusé'],
        datasets: [{
          label: `Statistiques de présence (${this.statsData.start_date} au ${this.statsData.end_date})`,
          data: [
            this.statsData.present,
            this.statsData.absent,
            this.statsData.late,
            this.statsData.excused
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
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Nombre de présences'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Statut de présence'
            }
          }
        }
      }
    };

    this.statsChart = new Chart(this.chartCanvas, config);
  }
  //-------------------------------------------------------------------------------------------------------

  loadItems(): void {
    this.adminService.getItems(this.selectedModel, this.currentPage)
      .subscribe(response => {
        this.items = response.data;
        this.currentPage = response.current_page;
        this.totalPages = response.last_page;
        this.initForm();
      });
  }

  initForm(): void {
    const formConfig: FormConfig = {};
    
    switch(this.selectedModel) {
      case 'salles':
        formConfig['nom'] = ['', Validators.required];
        formConfig['latitude'] = ['', [Validators.required, Validators.pattern(/^-?\d+\.?\d*$/)]];
        formConfig['longitude'] = ['', [Validators.required, Validators.pattern(/^-?\d+\.?\d*$/)]];
        formConfig['rayon_metres'] = ['', [Validators.required, Validators.min(1)]];
        break;
      
      case 'enseignants':
        formConfig['nom'] = ['', Validators.required];
        formConfig['prenom'] = ['', Validators.required];
        formConfig['email'] = ['', [Validators.required, Validators.email]];
        formConfig['matricule'] = ['', Validators.required];
        formConfig['password'] = ['', this.isEditing ? Validators.nullValidator : Validators.required];
        formConfig['photo'] = [null];
        break;
      
      case 'etudiants':
        formConfig['nom'] = ['', Validators.required];
        formConfig['prenom'] = ['', Validators.required];
        formConfig['email'] = ['', [Validators.required, Validators.email]];
        formConfig['matricule'] = ['', Validators.required];
        formConfig['password'] = ['', this.isEditing ? Validators.nullValidator : Validators.required];
        formConfig['filiere_id'] = ['', Validators.required];
        formConfig['niveau_id'] = ['', Validators.required];
        formConfig['photo'] = [null];
        formConfig['Date_nais'] = [''];
        formConfig['sexe'] = [''];
        break;
      
      case 'filieres':
        formConfig['nom'] = ['', Validators.required];
        formConfig['code'] = ['', Validators.required];
        break;
      
      case 'niveaux':
        formConfig['nom'] = ['', Validators.required];
        formConfig['code'] = ['', Validators.required];
        break;
      
      case 'matieres':
        formConfig['nom'] = ['', Validators.required];
        formConfig['code'] = ['', Validators.required];
        formConfig['filiere_id'] = ['', Validators.required];
        formConfig['niveau_id'] = ['', Validators.required];
        break;
      
      default:
        console.warn('Modèle non reconnu:', this.selectedModel);
    }

    this.itemForm = this.fb.group(formConfig);
    
    if (this.isEditing && this.currentItemId) {
      const item = this.items.find((i: any) => i.id === this.currentItemId);
      if (item) {
        // Ne pas remplir le mot de passe pour l'édition
        if (item.password) delete item.password;
        this.itemForm.patchValue(item);
      }
    }
  }

  onModelChange(): void {
    this.currentPage = 1;
    this.isEditing = false;
    this.currentItemId = null;
    this.loadItems();
  }

  onSubmit(): void {
    if (this.itemForm.invalid) return;

    const data = this.itemForm.value;

    if (this.isEditing && this.currentItemId) {
      this.adminService.updateItem(this.selectedModel, this.currentItemId, data)
        .subscribe(() => {
          this.loadItems();
          this.resetForm();
        });
    } else {
      this.adminService.createItem(this.selectedModel, data)
        .subscribe(() => {
          this.loadItems();
          this.resetForm();
        });
    }
  }

  onEdit(item: any): void {
    this.isEditing = true;
    this.currentItemId = item.id;
    this.initForm();
  }

  onDelete(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      this.adminService.deleteItem(this.selectedModel, id)
        .subscribe(() => this.loadItems());
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentItemId = null;
    this.initForm();
  }

  // Gestion des relations enseignant
  loadTeacherRelations(teacher: any): void {
    this.selectedTeacher = teacher;
    
    // Charger les listes disponibles
    this.adminService.getItems('filieres').subscribe(res => this.availableFilieres = res.data);
    this.adminService.getItems('niveaux').subscribe(res => this.availableNiveaux = res.data);
    this.adminService.getItems('matieres').subscribe(res => this.availableMatieres = res.data);
    
    // Charger les relations existantes
    this.adminService.getTeacherRelations(teacher.id).subscribe(relations => {
      // Préparer les données pour l'affichage
    });
  }

  saveTeacherRelations(): void {
    const data = {
      filieres: this.selectedTeacher.filieres.map((f: any) => f.id),
      niveaux: this.selectedTeacher.niveaux.map((n: any) => n.id),
      matieres: this.selectedTeacher.matieres.map((m: any) => m.id)
    };

    this.adminService.linkTeacherToEntities(this.selectedTeacher.id, data)
      .subscribe((response: any) => {
        this.selectedTeacher = response.teacher;
        alert('Associations mises à jour avec succès');
      });
  }

  isFiliereSelected(filiereId: number): boolean {
    return this.selectedTeacher?.filieres?.some((f: any) => f.id === filiereId);
  }

  toggleFiliere(filiereId: number): void {
    if (this.isFiliereSelected(filiereId)) {
      this.selectedTeacher.filieres = this.selectedTeacher.filieres.filter((f: any) => f.id !== filiereId);
    } else {
      const filiere = this.availableFilieres.find(f => f.id === filiereId);
      if (filiere) {
        this.selectedTeacher.filieres = [...(this.selectedTeacher.filieres || []), filiere];
      }
    }
  }

  // Méthodes similaires pour niveaux et matieres
  isNiveauSelected(niveauId: number): boolean {
    return this.selectedTeacher?.niveaux?.some((n: any) => n.id === niveauId);
  }

  toggleNiveau(niveauId: number): void {
    if (this.isNiveauSelected(niveauId)) {
      this.selectedTeacher.niveaux = this.selectedTeacher.niveaux.filter((n: any) => n.id !== niveauId);
    } else {
      const niveau = this.availableNiveaux.find(n => n.id === niveauId);
      if (niveau) {
        this.selectedTeacher.niveaux = [...(this.selectedTeacher.niveaux || []), niveau];
      }
    }
  }

  isMatiereSelected(matiereId: number): boolean {
    return this.selectedTeacher?.matieres?.some((m: any) => m.id === matiereId);
  }

  toggleMatiere(matiereId: number): void {
    if (this.isMatiereSelected(matiereId)) {
      this.selectedTeacher.matieres = this.selectedTeacher.matieres.filter((m: any) => m.id !== matiereId);
    } else {
      const matiere = this.availableMatieres.find(m => m.id === matiereId);
      if (matiere) {
        this.selectedTeacher.matieres = [...(this.selectedTeacher.matieres || []), matiere];
      }
    }
  }

  getTableColumns(): string[] {
    switch(this.selectedModel) {
      case 'salles': return ['id', 'nom', 'latitude', 'longitude', 'rayon_metres'];
      case 'enseignants': return ['id', 'nom', 'prenom', 'email', 'matricule'];
      case 'etudiants': return ['id', 'nom', 'prenom', 'email', 'matricule', 'filiere_id', 'niveau_id'];
      case 'filieres': return ['id', 'nom', 'code'];
      case 'niveaux': return ['id', 'nom', 'code'];
      case 'matieres': return ['id', 'nom', 'code', 'filiere_id', 'niveau_id'];
      default: return [];
    }
  }

  getInputType(controlName: string): string {
    if (controlName.includes('password')) return 'password';
    if (controlName.includes('email')) return 'email';
    if (controlName.includes('Date_nais')) return 'date';
    if (controlName.includes('photo')) return 'file';
    if (controlName.includes('latitude') || controlName.includes('longitude') || controlName.includes('rayon_metres')) {
      return 'number';
    }
    return 'text';
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadItems();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadItems();
    }
  }

  // Méthode pour obtenir le label du modèle courant
  getCurrentModelLabel(): string {
    const model = this.models.find(m => m.name === this.selectedModel);
    return model ? model.label : '';
  }

  // Méthode pour obtenir les noms des contrôles du formulaire
  getFormControlNames(): string[] {
    return Object.keys(this.itemForm.controls);
  }

  generateUsageChart(): void {
    Promise.all([
      this.adminService.getUserActivity('enseignant').toPromise(),
      this.adminService.getUserActivity('etudiant').toPromise()
    ]).then(([teachers, students]) => {
      const periods = ['Aujourd\'hui', '7 derniers jours', '30 derniers jours'];
      const now = new Date();
      
      const countPerPeriod = (list: any[]) => ({
        today: list.filter(u => new Date(u.UPDATED_AT).toDateString() === now.toDateString()).length,
        last7Days: list.filter(u => new Date(u.UPDATED_AT) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length,
        last30Days: list.filter(u => new Date(u.UPDATED_AT) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)).length
      });

      const teacherStats = countPerPeriod(teachers ?? []);
      const studentStats = countPerPeriod(students ?? []);


      const data = {
        labels: periods,
        datasets: [
          {
            label: 'Enseignants',
            data: [teacherStats.today, teacherStats.last7Days, teacherStats.last30Days],
            backgroundColor: 'rgba(54, 162, 235, 0.6)'
          },
          {
            label: 'Étudiants',
            data: [studentStats.today, studentStats.last7Days, studentStats.last30Days],
            backgroundColor: 'rgba(255, 99, 132, 0.6)'
          }
        ]
      };

      const ctx = (document.getElementById('usageChart') as HTMLCanvasElement).getContext('2d');
      new Chart(ctx!, {
        type: 'bar',
        data,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Taux d’utilisation de l’application'
            }
          }
        }
      });
    });
  }

  // Importation des fichiers Excel csv, xlsx etc... -----------------------------------------------------------
  onImport(form: NgForm) {
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

}

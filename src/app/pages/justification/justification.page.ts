import { Component, OnInit } from '@angular/core';
interface Justificatif {
  id: number;
  statut: 'En cours' | 'Accepté' | 'Rejeté' | 'Nouveau';
  avatar: string;
  expeditor: string;
  expeditor_email: string;
  message: string;
  joined: string;
  date: Date;
  session: string;
  enseignant: string;
}
@Component({
  selector: 'app-justification',
  templateUrl: './justification.page.html',
  styleUrls: ['./justification.page.scss'],
  standalone: false
})
export class JustificationPage implements OnInit {
  isMenuOpen = false;
  isSmallScreen = false;

  justificatifs: Justificatif[] = [
    {
      id: 1,
      expeditor: 'Bardela J.',
      message: 'Cause de l\'absence : j\'avais mieux à faire.',
      avatar: '../../../../assets/images/profil.jpg',
      joined: "../../../../assets/images/profil.jpg",
      statut: 'Nouveau',
      date: new Date('2025-04-12'),
      session: "INF 418",
      expeditor_email: "test@exemple.com",
      enseignant: "Dr.Moskolai"
    },
    {
      id: 2,
      expeditor: 'Gabriel A.',
      message: 'Cause de l\'absence : maladie',
      avatar: '../../../../assets/images/profil.jpg',
      joined: "../../../../assets/images/profil.jpg",
      statut: 'Accepté',
      date: new Date('2025-04-12'),
      session: "DAP 417",
      expeditor_email: "gabriel@exemple.com",
      enseignant: "Dr.Djeumen"
    },
    // ... autres éléments
  ];
  
  // Pagination
  page = 1;
  parPage = 10;
  total = 100;

  showFormulaireJustification: boolean = false;
  showReponseJustification: boolean = false;
  selectedJustification!: Justificatif;
  nouvelleJustification!: Justificatif;
  userRole: 'etudiant' | 'enseignant' = 'etudiant'; // À déterminer via votre service d'authentification
  isModalRedigerOpen = false;
  isModalRepondreOpen = false;
  currentJustificatif: any = null;

  enseignants = [
    { id: 1, nom: 'Dr. Moskolai', email: 'moskolai@univ.fr' },
    { id: 2, nom: 'Prof. Dupont', email: 'dupont@univ.fr' }
  ];

  coursManques = [
    { id: 1, nom: 'Algorithmique Avancée', date: '2023-10-15', semaine: 5 },
    { id: 2, nom: 'Base de Données', date: '2023-10-18', semaine: 5 }
  ];

  nouveauJustificatif = {
    enseignant: null,
    cours: null,
    message: '',
    fichier: null
  };

  reponse = {
    decision: 'accepte',
    commentaire: ''
  };

  ouvrirModalRediger() {
    this.isModalRedigerOpen = true;
  }

  ouvrirModalRepondre(justificatif: any) {
    this.currentJustificatif = justificatif;
    this.isModalRepondreOpen = true;
  }

  soumettreJustificatif() {
    console.log('Justificatif soumis:', this.nouveauJustificatif);
    this.isModalRedigerOpen = false;
    // Réinitialiser le formulaire
    this.nouveauJustificatif = {
      enseignant: null,
      cours: null,
      message: '',
      fichier: null
    };
  }

  repondreJustificatif(accepte: boolean) {
    console.log('Réponse:', accepte, 'pour', this.currentJustificatif);
    this.isModalRepondreOpen = false;
  }

  //------------------------------------------------------------------------
  // Méthode pour gérer la sélection de fichier
  onFileSelected(event: any) {
    this.nouvelleJustification.joined = event.target.files[0];
  }

  // Grouper les cours par semaine
  groupBySemaine(cours: any[]): any[] {
    return [...new Set(cours.map(c => c.semaine))]
      .map(semaine => ({
        semaine,
        cours: cours.filter(c => c.semaine === semaine)
      }));
  }

  // Modifier la méthode voirDetails pour les enseignants
  voirDetails(justificatif: any) {
    this.selectedJustification = justificatif;
    
    if (this.userRole === 'enseignant') {
      this.showReponseJustification = true;
    } else {
      // Logique pour les étudiants si nécessaire
    }
  }

  // Soumettre une nouvelle justification
  soumettreJustification() {
    // Ici, ajoutez la logique pour envoyer la justification
    console.log('Nouvelle justification:', this.nouvelleJustification);
    this.showFormulaireJustification = false;
    this.resetFormulaire();
  }

  // Envoyer une réponse
  envoyerReponse() {
    // Ici, ajoutez la logique pour enregistrer la réponse
    console.log('Réponse:', this.reponse);
    this.showReponseJustification = false;
    this.resetReponse();
  }

  // Réinitialiser les formulaires
  resetFormulaire() {
    this.nouvelleJustification = {
      id: 0,
      enseignant: "",
      session: "",
      message: '',
      joined: "",
      expeditor: "",
      expeditor_email: "",
      statut: "Nouveau",
      avatar: "",
      date: new Date()
    };
  }

  resetReponse() {
    this.reponse = {
      decision: 'accepte',
      commentaire: ''
    };
  }
  //------------------------------------------------------------------------

  telecharger(justificatif: Justificatif){}
  
  get debut(): number {
    return (this.page - 1) * this.parPage + 1;
  }
  
  get fin(): number {
    return Math.min(this.page * this.parPage, this.total);
  }
  
  get totalPages(): number {
    return Math.ceil(this.total / this.parPage);
  }
  
  get pages(): (number | string)[] {
    const pages = [];
    // Logique de pagination...
    return [1, 2, 3, '...', this.totalPages];
  }
  
  pagePrecedente() {
    if (this.page > 1) this.page--;
  }
  
  pageSuivante() {
    if (this.page < this.totalPages) this.page++;
  }
  
  allerPage(page: number | string) {
    if (typeof page === 'number') {
      this.page = page;
    }
  }

  constructor() { }

  ngOnInit() {
  }

}

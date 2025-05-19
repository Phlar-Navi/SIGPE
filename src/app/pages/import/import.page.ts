import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Component({
  selector: 'app-import',
  templateUrl: './import.page.html',
  styleUrls: ['./import.page.scss'],
  standalone: false
})
export class ImportPage implements OnInit {
  profileForm!: FormGroup;
  fichier: File | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    this.profileForm = this.fb.group({
      fichier: [null, Validators.required]
    });
  }

  onFileSelected(event: any) {
  const file: File = event.target.files[0];
  const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  if (file && validTypes.includes(file.type)) {
    this.fichier = file;
    this.profileForm.patchValue({ fichier: file });
  } else {
    alert('Seuls les fichiers .csv ou .xlsx sont autorisés.');
  }
}


  onSubmit() {
  if (this.profileForm.invalid || !this.fichier) {
    return;
  }

  const formData = new FormData();
  formData.append('fichier', this.fichier);
  console.log('Fichier à envoyer:', this.fichier);

  this.http.post(`https://192.168.17.238:8000/api/importerExcel`, formData).subscribe({
    next: (response) => {
      console.log('Succès:', response);
    },
    error: (err) => {
      console.error('Erreur:', err);
    }
  });
}

}

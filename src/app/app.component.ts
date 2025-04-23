import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private authService: AuthService) {
    // this.authService.getUserObservable().subscribe(user => {
    //   console.log('🧪 User observable test:', user);
    // });
  }
}

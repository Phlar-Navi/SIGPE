// sidebar-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private isMenuOpen = new BehaviorSubject<boolean>(false);
  isMenuOpen$ = this.isMenuOpen.asObservable();

  toggleMenu() {
    this.isMenuOpen.next(!this.isMenuOpen.value);
  }
}
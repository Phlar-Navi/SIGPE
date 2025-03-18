import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarStateService } from 'src/app/services/sidebar-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule] // Importe CommonModule pour utiliser ngClass
})
export class SidebarComponent  implements OnInit {
  isMenuOpen = false;
  isSmallScreen = false;

  constructor(public sidebarState: SidebarStateService,
    public router: Router
  ){}

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.checkScreenSize();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  gotoPage(value: number){
    switch (value){
      case 1:
        this.router.navigateByUrl("/student-dashboard");
        break;
      case 5:
        this.router.navigateByUrl("/student-course");
        break;
      default:
        this.router.navigateByUrl("/student-dashboard");
        break;
    }
  }

  // toggleMenu() {
  //   this.sidebarState.toggleMenu();
  // }

  checkScreenSize() {
    this.isSmallScreen = window.innerWidth < 768; // 768px est la breakpoint pour les petits écrans
  }

}

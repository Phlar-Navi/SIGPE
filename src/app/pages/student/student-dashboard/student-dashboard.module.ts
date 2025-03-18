import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StudentDashboardPageRoutingModule } from './student-dashboard-routing.module';

import { StudentDashboardPage } from './student-dashboard.page';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { HeaderComponent } from 'src/app/components/header/header.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StudentDashboardPageRoutingModule,
    SidebarComponent,
    HeaderComponent
  ],
  declarations: [StudentDashboardPage] //SidebarComponent
})
export class StudentDashboardPageModule {}

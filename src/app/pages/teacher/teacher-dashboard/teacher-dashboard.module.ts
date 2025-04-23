import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TeacherDashboardPageRoutingModule } from './teacher-dashboard-routing.module';

import { TeacherDashboardPage } from './teacher-dashboard.page';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { HeaderComponent } from 'src/app/components/header/header.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TeacherDashboardPageRoutingModule,
    SidebarComponent,
    HeaderComponent
  ],
  declarations: [TeacherDashboardPage]
})
export class TeacherDashboardPageModule {}

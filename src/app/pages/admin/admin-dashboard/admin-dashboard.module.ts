import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminDashboardPageRoutingModule } from './admin-dashboard-routing.module';

import { AdminDashboardPage } from './admin-dashboard.page';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { HeaderComponent } from 'src/app/components/header/header.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminDashboardPageRoutingModule,
    SidebarComponent,
    HeaderComponent
  ],
  declarations: [AdminDashboardPage] //SidebarComponent
})
export class AdminDashboardPageModule {}

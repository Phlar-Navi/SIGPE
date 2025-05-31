import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StudentJustificatifPageRoutingModule } from './student-justificatif-routing.module';

import { StudentJustificatifPage } from './student-justificatif.page';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { HeaderComponent } from 'src/app/components/header/header.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StudentJustificatifPageRoutingModule,
    SidebarComponent,
    HeaderComponent
  ],
  declarations: [StudentJustificatifPage]
})
export class StudentJustificatifPageModule {}

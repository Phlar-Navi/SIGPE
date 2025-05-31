import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TeacherJustificatifPageRoutingModule } from './teacher-justificatif-routing.module';

import { TeacherJustificatifPage } from './teacher-justificatif.page';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { HeaderComponent } from 'src/app/components/header/header.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TeacherJustificatifPageRoutingModule,
    SidebarComponent,
    HeaderComponent
  ],
  declarations: [TeacherJustificatifPage]
})
export class TeacherJustificatifPageModule {}

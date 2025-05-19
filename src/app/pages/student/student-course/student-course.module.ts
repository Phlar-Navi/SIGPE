import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StudentCoursePageRoutingModule } from './student-course-routing.module';

import { StudentCoursePage } from './student-course.page';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { SessionListComponent } from 'src/app/components/session-list/session-list.component';
import { SessionDetailsComponent } from 'src/app/components/session-details/session-details.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StudentCoursePageRoutingModule,
    SidebarComponent,
    HeaderComponent,
    SessionListComponent,
    SessionDetailsComponent
  ],
  declarations: [StudentCoursePage]
})
export class StudentCoursePageModule {}

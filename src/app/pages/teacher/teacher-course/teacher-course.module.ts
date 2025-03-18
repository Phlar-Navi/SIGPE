import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TeacherCoursePageRoutingModule } from './teacher-course-routing.module';

import { TeacherCoursePage } from './teacher-course.page';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { SessionListComponent } from 'src/app/components/session-list/session-list.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TeacherCoursePageRoutingModule,
    SidebarComponent,
    HeaderComponent, 
    SessionListComponent
  ],
  declarations: [TeacherCoursePage]
})
export class TeacherCoursePageModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TeacherCoursePage } from './teacher-course.page';

const routes: Routes = [
  {
    path: '',
    component: TeacherCoursePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeacherCoursePageRoutingModule {}

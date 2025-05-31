import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TeacherJustificatifPage } from './teacher-justificatif.page';

const routes: Routes = [
  {
    path: '',
    component: TeacherJustificatifPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeacherJustificatifPageRoutingModule {}

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'student-dashboard',
    loadChildren: () => import('./pages/student/student-dashboard/student-dashboard.module').then( m => m.StudentDashboardPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'teacher-dashboard',
    loadChildren: () => import('./pages/teacher/teacher-dashboard/teacher-dashboard.module').then( m => m.TeacherDashboardPageModule)
  },
  {
    path: 'admin-dashboard',
    loadChildren: () => import('./pages/admin/admin-dashboard/admin-dashboard.module').then( m => m.AdminDashboardPageModule)
  },
  {
    path: 'student-course',
    loadChildren: () => import('./pages/student/student-course/student-course.module').then( m => m.StudentCoursePageModule)
  },
  {
    path: 'teacher-course',
    loadChildren: () => import('./pages/teacher/teacher-course/teacher-course.module').then( m => m.TeacherCoursePageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { typeGuard } from './guards/type.guard';
import { typeStudentGuard } from './guards/type-student.guard';
import { redirectIfAuthenticatedGuard } from './guards/redirect-if-authenticated.guard';

const routes: Routes = [
  {
    path: 'home',
    // canActivate: [redirectIfAuthenticatedGuard],
    loadChildren: () => import('./pages/authentification/login/login.module').then( m => m.LoginPageModule)
  },
  // {
  //   path: 'home',
  //   loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  // },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'student-dashboard',
    // canActivate: [typeStudentGuard(['ETU'])],
    loadChildren: () => import('./pages/student/student-dashboard/student-dashboard.module').then( m => m.StudentDashboardPageModule)
  },
  {
    path: 'register',
    // canActivate: [redirectIfAuthenticatedGuard],
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'teacher-dashboard',
    // canActivate: [typeGuard(['ENS'])],
    loadChildren: () => import('./pages/teacher/teacher-dashboard/teacher-dashboard.module').then( m => m.TeacherDashboardPageModule)
  },
  {
    path: 'admin-dashboard',
    // canActivate: [authGuard],
    loadChildren: () => import('./pages/admin/admin-dashboard/admin-dashboard.module').then( m => m.AdminDashboardPageModule)
  },
  {
    path: 'student-course',
    // canActivate: [typeStudentGuard(['ETU'])],
    loadChildren: () => import('./pages/student/student-course/student-course.module').then( m => m.StudentCoursePageModule)
  },
  {
    path: 'teacher-course',
    // canActivate: [typeGuard(['ENS'])],
    loadChildren: () => import('./pages/teacher/teacher-course/teacher-course.module').then( m => m.TeacherCoursePageModule)
  },
  {
    path: 'profile',
    // canActivate: [authGuard],
    loadChildren: () => import('./pages/profile/profile.module').then( m => m.ProfilePageModule)
  },
  {
    path: 'notification',
    // canActivate: [authGuard],
    loadChildren: () => import('./pages/notification/notification.module').then( m => m.NotificationPageModule)
  },
  {
    path: 'justification',
    // canActivate: [authGuard],
    loadChildren: () => import('./pages/justification/justification.module').then( m => m.JustificationPageModule)
  },
  {
    path: 'login',
    // canActivate: [redirectIfAuthenticatedGuard],
    loadChildren: () => import('./pages/authentification/login/login.module').then( m => m.LoginPageModule)
  },  {
    path: 'import',
    loadChildren: () => import('./pages/import/import.module').then( m => m.ImportPageModule)
  },
  {
    path: 'teacher-justificatif',
    loadChildren: () => import('./pages/teacher/teacher-justificatif/teacher-justificatif.module').then( m => m.TeacherJustificatifPageModule)
  },
  {
    path: 'student-justificatif',
    loadChildren: () => import('./pages/student/student-justificatif/student-justificatif.module').then( m => m.StudentJustificatifPageModule)
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

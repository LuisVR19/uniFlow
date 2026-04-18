import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadChildren: () => import('./pages/auth/login/login.module').then((m) => m.LoginPageModule),
      },
      {
        path: 'register',
        loadChildren: () => import('./pages/auth/register/register.module').then((m) => m.RegisterPageModule),
      },
    ],
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then((m) => m.HomePageModule),
    canActivate: [authGuard],
  },
  {
    path: 'schedule',
    loadChildren: () => import('./pages/schedule/schedule.module').then((m) => m.SchedulePageModule),
    canActivate: [authGuard],
  },
  {
    path: 'add-event',
    loadChildren: () => import('./pages/add-event/add-event.module').then((m) => m.AddEventPageModule),
    canActivate: [authGuard],
  },
  {
    path: 'semesters',
    loadChildren: () => import('./pages/semesters/semesters.module').then((m) => m.SemestersPageModule),
    canActivate: [authGuard],
  },
  {
    path: 'courses/:semesterId',
    loadChildren: () => import('./pages/courses/courses.module').then((m) => m.CoursesPageModule),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/profile/profile.module').then((m) => m.ProfilePageModule),
    canActivate: [authGuard],
  },
  {
    path: 'tasks',
    loadChildren: () => import('./pages/tasks/tasks.module').then((m) => m.TasksPageModule),
    canActivate: [authGuard],
  },
  {
    path: 'course-detail/:courseId',
    loadChildren: () =>
      import('./pages/course-detail/course-detail.module').then((m) => m.CourseDetailPageModule),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}

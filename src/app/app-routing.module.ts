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
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.module').then((m) => m.TabsPageModule),
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
    path: 'course-detail/:courseId',
    loadChildren: () =>
      import('./pages/course-detail/course-detail.module').then((m) => m.CourseDetailPageModule),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}

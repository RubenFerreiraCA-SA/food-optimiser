import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { PantryPage } from './pages/pantry-page/pantry-page';
import { MenuPage } from './pages/menu-page/menu-page';
import { PlannerPage } from './pages/planner-page/planner-page';
import { LoginPage } from './pages/auth-page/login-page/login-page';
import { RegisterPage } from './pages/auth-page/register-page/register-page';
import { guestGuard, authGuard } from './services/core/auth/auth.guard';

export const routes: Routes = [
  // Pre-login pages
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'register', component: RegisterPage, canActivate: [guestGuard] },
  // Post-login pages
  { path: '', component: HomePage, canActivate: [authGuard] },
  { path: 'pantry', component: PantryPage, canActivate: [authGuard] },
  { path: 'menu', component: MenuPage, canActivate: [authGuard] },
  { path: 'planner', component: PlannerPage, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];

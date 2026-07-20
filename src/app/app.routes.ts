import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { PantryPage } from './pages/pantry-page/pantry-page';
import { MenuPage } from './pages/menu-page/menu-page';
import { PlannerPage } from './pages/planner-page/planner-page';
import { NewRecipePage } from './pages/menu-page/new-recipe-page/new-recipe-page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'home', component: HomePage },
  { path: 'pantry', component: PantryPage },
  { path: 'menu/new', component: NewRecipePage },
  { path: 'menu/:id/edit', component: NewRecipePage },
  { path: 'menu', component: MenuPage },
  { path: 'planner', component: PlannerPage },
  { path: '**', redirectTo: 'home' },
];

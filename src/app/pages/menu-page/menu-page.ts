import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuService, Recipe } from '../../services/menu.service';

@Component({
  selector: 'app-menu-page',
  imports: [RouterLink],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.scss',
})
export class MenuPage {
  readonly menu = inject(MenuService);
  readonly recipeToRemove = signal<Recipe | null>(null);
  requestRemoval(recipe: Recipe): void { this.recipeToRemove.set(recipe); }
  cancelRemoval(): void { this.recipeToRemove.set(null); }
  confirmRemoval(): void { const recipe = this.recipeToRemove(); if (recipe) this.menu.remove(recipe.id); this.recipeToRemove.set(null); }
}

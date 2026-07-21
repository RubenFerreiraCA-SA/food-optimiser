import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MenuService, RecipeIngredient } from '../../../shared/services/menu.service';

@Component({ selector: 'app-new-recipe-page', imports: [FormsModule, RouterLink], templateUrl: './new-recipe-page.html', styleUrl: './new-recipe-page.scss' })
export class NewRecipePage {
  private readonly router = inject(Router);
  private readonly menu = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  readonly recipeId = this.route.snapshot.paramMap.get('id');
  readonly isEditing = !!this.recipeId;
  name = ''; servings = 1;
  readonly ingredients = signal<RecipeIngredient[]>([{ name: '', quantity: 1 }]);
  constructor() {
    const recipe = this.recipeId ? this.menu.find(this.recipeId) : undefined;
    if (recipe) {
      this.name = recipe.name;
      this.servings = recipe.servings;
      this.ingredients.set(recipe.ingredients.map((ingredient) => ({ ...ingredient })));
    }
  }
  addIngredient(): void { this.ingredients.update((items) => [...items, { name: '', quantity: 1 }]); }
  removeIngredient(index: number): void { this.ingredients.update((items) => items.filter((_, itemIndex) => itemIndex !== index)); }
  updateIngredient(index: number, field: keyof RecipeIngredient, value: string | number): void { this.ingredients.update((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)); }
  save(): void { const ingredients = this.ingredients().filter((item) => item.name.trim() && item.quantity > 0).map((item) => ({ ...item, name: item.name.trim() })); if (!this.name.trim() || !ingredients.length || this.servings < 1) return; const recipe = { name: this.name.trim(), servings: this.servings, ingredients }; if (this.recipeId) this.menu.updateRecipe(this.recipeId, recipe); else this.menu.add(recipe); this.router.navigateByUrl('/menu'); }
}

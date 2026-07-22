import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecipeIngredient, Recipe } from '../../../services/page-helpers/menu/menu.service';

@Component({
  selector: 'app-new-recipe-view',
  imports: [FormsModule],
  templateUrl: './new-recipe-view.html',
  styleUrl: './new-recipe-view.scss',
})
export class NewRecipeView {
  private recipeId: string | null = null;
  isEditing = false;
  name = '';
  servings = 1;
  readonly ingredients = signal<RecipeIngredient[]>([{ name: '', quantity: 1 }]);
  @Output() readonly saved = new EventEmitter<{ id: string | null; recipe: Omit<Recipe, 'id'> }>();
  @Output() readonly cancelled = new EventEmitter<void>();

  @Input() set recipe(recipe: Recipe | null) {
    this.recipeId = recipe?.id ?? null;
    this.isEditing = !!recipe;
    if (recipe) {
      this.name = recipe.name;
      this.servings = recipe.servings;
      this.ingredients.set(recipe.ingredients.map((ingredient) => ({ ...ingredient })));
    } else {
      this.name = '';
      this.servings = 1;
      this.ingredients.set([{ name: '', quantity: 1 }]);
    }
  }
  addIngredient(): void {
    this.ingredients.update((items) => [...items, { name: '', quantity: 1 }]);
  }
  removeIngredient(index: number): void {
    this.ingredients.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }
  updateIngredient(index: number, field: keyof RecipeIngredient, value: string | number): void {
    this.ingredients.update((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  }
  save(): void {
    const ingredients = this.ingredients()
      .filter((item) => item.name.trim() && item.quantity > 0)
      .map((item) => ({ ...item, name: item.name.trim() }));
    if (!this.name.trim() || !ingredients.length || this.servings < 1) return;
    this.saved.emit({
      id: this.recipeId,
      recipe: { name: this.name.trim(), servings: this.servings, ingredients },
    });
  }
}

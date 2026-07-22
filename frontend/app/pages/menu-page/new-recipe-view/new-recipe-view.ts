import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IngredientCatalogService } from '../../../services/data/ingredient-catalog.service';
import { Recipe } from '../../../services/data/shared-types';

interface RecipeIngredientRow {
  ingredientId: string;
  quantity: number;
}

@Component({
  selector: 'app-new-recipe-view',
  imports: [FormsModule],
  templateUrl: './new-recipe-view.html',
  styleUrl: './new-recipe-view.scss',
})
export class NewRecipeView {
  private readonly catalog = inject(IngredientCatalogService);
  private recipeId: string | null = null;
  isEditing = false;
  name = '';
  servings = 1;
  readonly ingredients = signal<RecipeIngredientRow[]>([{ ingredientId: '', quantity: 1 }]);
  @Output() readonly saved = new EventEmitter<{ id: string | null; recipe: Omit<Recipe, 'id'> }>();
  @Output() readonly cancelled = new EventEmitter<void>();

  @Input() set recipe(recipe: Recipe | null) {
    this.recipeId = recipe?.id ?? null;
    this.isEditing = !!recipe;
    if (recipe) {
      this.name = recipe.name;
      this.servings = recipe.servings;
      this.ingredients.set(
        Object.entries(recipe.ingredients).map(([ingredientId, quantity]) => ({
          ingredientId,
          quantity,
        })),
      );
    } else {
      this.name = '';
      this.servings = 1;
      this.ingredients.set([{ ingredientId: '', quantity: 1 }]);
    }
  }
  addIngredient(): void {
    this.ingredients.update((items) => [...items, { ingredientId: '', quantity: 1 }]);
  }
  removeIngredient(index: number): void {
    this.ingredients.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }
  updateIngredient(index: number, field: keyof RecipeIngredientRow, value: string | number): void {
    this.ingredients.update((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  }
  ingredientOptions() {
    return this.catalog.ingredients();
  }
  save(): void {
    const ingredients = this.ingredients()
      .filter((item) => item.ingredientId.trim() && item.quantity > 0)
      .reduce<Record<string, number>>((next, item) => {
        const ingredientId = item.ingredientId.trim();
        next[ingredientId] = (next[ingredientId] ?? 0) + Math.floor(item.quantity);
        return next;
      }, {});
    if (!this.name.trim() || !Object.keys(ingredients).length || this.servings < 1) return;
    this.saved.emit({
      id: this.recipeId,
      recipe: { name: this.name.trim(), servings: this.servings, image: '', ingredients },
    });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuService, Recipe } from '../../services/menu.service';
import { PantryIngredient, PantryService } from '../../services/pantry.service';

@Component({
  selector: 'app-pantry-page',
  imports: [FormsModule],
  templateUrl: './pantry-page.html',
  styleUrl: './pantry-page.scss',
})
export class PantryPage {
  readonly pantry = inject(PantryService);
  private readonly menu = inject(MenuService);
  readonly isAdding = signal(false);
  readonly showResetWarning = signal(false);
  readonly ingredientToRemove = signal<PantryIngredient | null>(null);
  readonly blockedIngredient = signal<PantryIngredient | null>(null);
  readonly editingIngredientId = signal<string | null>(null);
  name = '';
  quantity = 1;
  editQuantity = 0;
  addError = '';
  editError = '';

  readonly blockedUsages = computed(() => {
    const ingredient = this.blockedIngredient();
    if (!ingredient) return [];
    return this.recipeUsages(ingredient);
  });

  addIngredient(): void {
    if (this.pantry.add(this.name, this.quantity)) {
      this.name = '';
      this.quantity = 1;
      this.addError = '';
      this.isAdding.set(false);
    } else this.addError = 'Enter a unique ingredient name and a quantity of at least one.';
  }
  requestRemoval(ingredient: PantryIngredient): void {
    this.recipeUsages(ingredient).length
      ? this.blockedIngredient.set(ingredient)
      : this.ingredientToRemove.set(ingredient);
  }
  startEditing(ingredient: PantryIngredient): void {
    this.editingIngredientId.set(ingredient.id);
    this.editQuantity = ingredient.quantity;
    this.editError = '';
  }
  cancelEditing(): void {
    this.editingIngredientId.set(null);
    this.editError = '';
  }
  saveQuantity(ingredient: PantryIngredient): void {
    if (this.pantry.setQuantity(ingredient.id, this.editQuantity)) this.cancelEditing();
    else this.editError = 'Enter a whole number of zero or more.';
  }
  cancelDialogs(): void {
    this.ingredientToRemove.set(null);
    this.blockedIngredient.set(null);
    this.showResetWarning.set(false);
  }
  confirmRemoval(): void {
    const ingredient = this.ingredientToRemove();
    if (ingredient) this.pantry.remove(ingredient.id);
    this.ingredientToRemove.set(null);
  }
  confirmReset(): void {
    this.pantry.reset();
    this.showResetWarning.set(false);
  }

  private recipeUsages(ingredient: PantryIngredient): { recipe: Recipe; quantity: number }[] {
    return this.menu
      .recipes()
      .flatMap((recipe) =>
        recipe.ingredients
          .filter((item) => item.name.toLowerCase() === ingredient.name.toLowerCase())
          .map((item) => ({ recipe, quantity: item.quantity })),
      );
  }
}

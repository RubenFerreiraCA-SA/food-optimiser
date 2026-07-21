import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuService, Recipe } from '../../shared/services/menu.service';
import { PantryIngredient, PantryService } from '../../shared/services/pantry.service';
import { Dialog, DialogConfig } from '../../shared/components/dialog/dialog';
import { PageHero, PageHeroConfig } from '../../shared/components/page-hero/page-hero';
import { IngredientTable, IngredientTableConfig, IngredientTableEvent } from '../../shared/components/ingredient-table/ingredient-table';

@Component({
  selector: 'app-pantry-page',
  imports: [FormsModule, Dialog, PageHero, IngredientTable],
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
  readonly hero: PageHeroConfig = { eyebrow: 'What you have', title: 'Your pantry.', description: 'Keep track of the ingredients available for your next meal plan.', titleId: 'pantry-title', markRotation: 16 };

  readonly blockedUsages = computed(() => {
    const ingredient = this.blockedIngredient();
    if (!ingredient) return [];
    return this.recipeUsages(ingredient);
  });
  get ingredientTable(): IngredientTableConfig {
    return {
    caption: 'Ingredients currently available in your pantry',
    quantityHeader: 'Quantity available',
    rows: this.pantry.ingredients(),
    quantityMode: 'editing',
    showQuantityLabel: true,
    editingId: this.editingIngredientId(),
    editingQuantity: this.editQuantity,
    editError: this.editError,
    actions: [{ id: 'edit', label: 'Edit' }, { id: 'remove', label: 'Remove', variant: 'remove' }],
    };
  }
  readonly resetDialog: DialogConfig = {
    eyebrow: 'Reset pantry', title: 'Restore default ingredients?', description: 'This replaces your current pantry quantities with the original starting values.',
    actions: [{ id: 'cancel', label: 'Cancel', variant: 'secondary' }, { id: 'confirm', label: 'Reset pantry', variant: 'danger' }],
  };

  removeDialog(ingredient: PantryIngredient): DialogConfig {
    return { eyebrow: 'Remove ingredient', title: `Remove ${ingredient.name}?`, description: 'This ingredient will no longer be available for meal planning.', actions: [{ id: 'cancel', label: 'Keep ingredient', variant: 'secondary' }, { id: 'confirm', label: 'Remove ingredient', variant: 'danger' }] };
  }

  blockedDialog(ingredient: PantryIngredient): DialogConfig {
    return { eyebrow: 'Ingredient in use', title: `${ingredient.name} can't be removed.`, description: 'It is still needed by these recipes:', list: this.blockedUsages().map((usage) => ({ label: usage.recipe.name, detail: `${usage.quantity}× ${ingredient.name}` })), actions: [{ id: 'close', label: 'Got it', variant: 'primary' }] };
  }

  handleResetDialog(action: string): void { action === 'confirm' ? this.confirmReset() : this.cancelDialogs(); }
  handleRemovalDialog(action: string): void { action === 'confirm' ? this.confirmRemoval() : this.cancelDialogs(); }

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
  updateEditingQuantity(quantity: number): void { this.editQuantity = quantity; }
  handleTableAction(event: IngredientTableEvent): void {
    if (event.action === 'edit') this.startEditing(event.row);
    if (event.action === 'remove') this.requestRemoval(event.row);
    if (event.action === 'save') this.saveQuantity(event.row);
    if (event.action === 'cancel') this.cancelEditing();
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

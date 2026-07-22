import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog, DialogConfig } from '../../shared/components/dialog/dialog';
import { PageHero, PageHeroConfig } from '../../shared/components/page-hero/page-hero';
import { IngredientTable, IngredientTableConfig, IngredientTableEvent } from '../../shared/components/ingredient-table/ingredient-table';
import { MenuService } from '../../services/page-helpers/menu/menu.service';
import { PantryService, PantryIngredient } from '../../services/page-helpers/pantry/pantry.service';
import { IngredientCatalogService } from '../../services/data/ingredient-catalog.service';
import type { Recipe, SharedIngredient } from '../../services/data/shared-types';

@Component({
  selector: 'app-pantry-page',
  imports: [FormsModule, Dialog, PageHero, IngredientTable],
  templateUrl: './pantry-page.html',
  styleUrl: './pantry-page.scss',
})
export class PantryPage {
  readonly pantry = inject(PantryService);
  private readonly menu = inject(MenuService);
  private readonly catalog = inject(IngredientCatalogService);
  readonly isAdding = signal(false);
  readonly showResetWarning = signal(false);
  readonly ingredientToRemove = signal<PantryIngredient | null>(null);
  readonly blockedIngredient = signal<PantryIngredient | null>(null);
  readonly editingIngredientId = signal<string | null>(null);
  readonly ingredientName = signal('');
  readonly ingredientSearch = signal('');
  readonly pendingIngredients = signal<PendingIngredient[]>([]);
  editQuantity = 0;
  addError = '';
  editError = '';
  readonly hero: PageHeroConfig = {
    eyebrow: 'What you have',
    title: 'Your pantry.',
    description: 'Keep track of the ingredients available for your next meal plan.',
    titleId: 'pantry-title',
    mark: '🥕',
    markRotation: 16,
  };

  readonly blockedUsages = computed(() => {
    const ingredient = this.blockedIngredient();
    if (!ingredient) return [];
    return this.recipeUsages(ingredient);
  });
  readonly ingredientMatches = computed(() => this.catalog.search(this.ingredientName()));
  readonly exactIngredientMatch = computed(() => this.catalog.findByName(this.ingredientName().trim()) ?? null);
  readonly canCreateIngredient = computed(
    () => this.ingredientName().trim().length >= 3 && !this.ingredientMatches().length,
  );
  readonly visibleIngredients = computed(() => {
    const query = this.ingredientSearch().trim().toLowerCase();
    return [...this.pantry.ingredients()]
      .filter((ingredient) => !query || ingredient.name.toLowerCase().includes(query))
      .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
  });
  get ingredientTable(): IngredientTableConfig {
    return {
      caption: 'Ingredients currently available in your pantry',
      quantityHeader: 'Quantity available',
      rows: this.visibleIngredients(),
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

  async handleResetDialog(action: string): Promise<void> {
    action === 'confirm' ? await this.confirmReset() : this.cancelDialogs();
  }
  async handleRemovalDialog(action: string): Promise<void> {
    action === 'confirm' ? await this.confirmRemoval() : this.cancelDialogs();
  }

  async addIngredient(): Promise<void> {
    const ingredient = this.exactIngredientMatch();
    if (ingredient) {
      this.queueIngredient(ingredient);
      return;
    }

    if (this.canCreateIngredient()) {
      await this.queueNewIngredient();
      return;
    }

    this.addError = 'Pick a match or choose to add a new ingredient.';
  }

  selectIngredient(option: SharedIngredient): void {
    this.queueIngredient(option);
  }

  async addNewIngredient(): Promise<void> {
    await this.queueNewIngredient();
  }

  updatePendingQuantity(id: string, quantity: number): void {
    const validQuantity = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
    this.pendingIngredients.update((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: validQuantity } : item)),
    );
  }

  async addPendingIngredient(id: string): Promise<void> {
    const pending = this.pendingIngredients().find((item) => item.id === id);
    if (!pending) return;
    if (await this.pantry.add(pending.id, pending.quantity)) {
      this.pendingIngredients.update((items) => items.filter((item) => item.id !== id));
      this.addError = '';
    } else {
      this.addError = 'Enter a quantity of at least one.';
    }
  }

  removePendingIngredient(id: string): void {
    this.pendingIngredients.update((items) => items.filter((item) => item.id !== id));
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
  async saveQuantity(ingredient: PantryIngredient): Promise<void> {
    if (await this.pantry.setQuantity(ingredient.id, this.editQuantity)) this.cancelEditing();
    else this.editError = 'Enter a whole number of zero or more.';
  }
  updateEditingQuantity(quantity: number): void { this.editQuantity = quantity; }
  async handleTableAction(event: IngredientTableEvent): Promise<void> {
    if (event.action === 'edit') this.startEditing(event.row);
    if (event.action === 'remove') this.requestRemoval(event.row);
    if (event.action === 'save') await this.saveQuantity(event.row);
    if (event.action === 'cancel') this.cancelEditing();
  }
  cancelDialogs(): void {
    this.ingredientToRemove.set(null);
    this.blockedIngredient.set(null);
    this.showResetWarning.set(false);
  }
  async confirmRemoval(): Promise<void> {
    const ingredient = this.ingredientToRemove();
    if (ingredient) await this.pantry.remove(ingredient.id);
    this.ingredientToRemove.set(null);
  }
  async confirmReset(): Promise<void> {
    await this.pantry.reset();
    this.showResetWarning.set(false);
  }

  onIngredientInput(): void {
    this.addError = '';
  }

  clearIngredientSearch(): void {
    this.ingredientSearch.set('');
  }

  queueIngredient(option: SharedIngredient, isNew = false): void {
    if (this.pendingIngredients().some((item) => item.id === option.id)) {
      this.addError = `${option.name} is already in the list below.`;
      return;
    }
    this.pendingIngredients.update((items) => [
      ...items,
      { id: option.id, name: option.name, quantity: 1, image: option.image, isNew },
    ]);
    this.ingredientName.set('');
    this.addError = '';
  }

  async queueNewIngredient(): Promise<void> {
    const name = this.ingredientName().trim();
    if (name.length < 3) {
      this.addError = 'Type at least three letters to add a new ingredient.';
      return;
    }
    const existing = this.catalog.findByName(name);
    if (existing) {
      this.queueIngredient(existing);
      return;
    }
    const ingredient = await this.catalog.add(name);
    if (!ingredient) {
      this.addError = 'That ingredient could not be created.';
      return;
    }
    this.queueIngredient(ingredient, true);
    this.addError = '';
  }

  private recipeUsages(ingredient: PantryIngredient): { recipe: Recipe; quantity: number }[] {
    return this.menu
      .recipes()
      .flatMap((recipe) =>
        Object.entries(recipe.ingredients)
          .filter(([ingredientId]) => ingredientId === ingredient.id)
          .map(([, quantity]) => ({ recipe, quantity })),
      );
  }
}

interface PendingIngredient {
  id: string;
  name: string;
  quantity: number;
  image: string;
  isNew: boolean;
}

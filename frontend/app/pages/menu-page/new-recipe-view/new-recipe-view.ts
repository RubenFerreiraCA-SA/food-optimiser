import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IngredientCatalogService } from '../../../services/data/ingredient-catalog.service';
import { MenuService } from '../../../services/page-helpers/menu/menu.service';
import { Recipe } from '../../../services/data/shared-types';
import type { SharedIngredient } from '../../../services/data/shared-types';

interface RecipeIngredientRow {
  ingredientId: string;
  ingredientName: string;
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
  private readonly menu = inject(MenuService);
  private recipeId: string | null = null;
  selectedRecipeId: string | null = null;
  isEditing = false;
  name = '';
  servings = 1;
  readonly ingredients = signal<RecipeIngredientRow[]>([{ ingredientId: '', ingredientName: '', quantity: 1 }]);
  @Output() readonly saved = new EventEmitter<{ id: string | null; recipe: Omit<Recipe, 'id'> }>();
  @Output() readonly cancelled = new EventEmitter<void>();

  readonly recipeMatches = signal<Recipe[]>([]);

  @Input() set recipe(recipe: Recipe | null) {
    this.recipeId = recipe?.id ?? null;
    this.selectedRecipeId = null;
    this.isEditing = !!recipe;
    if (recipe) {
      this.name = recipe.name;
      this.servings = recipe.servings;
      this.ingredients.set(
        Object.entries(recipe.ingredients).map(([ingredientId, quantity]) => ({
          ingredientId,
          ingredientName: this.catalog.nameFor(ingredientId),
          quantity,
        })),
      );
    } else {
      this.name = '';
      this.servings = 1;
      this.ingredients.set([{ ingredientId: '', ingredientName: '', quantity: 1 }]);
    }
    this.refreshRecipeMatches();
  }

  addIngredient(): void {
    this.ingredients.update((items) => [...items, { ingredientId: '', ingredientName: '', quantity: 1 }]);
  }

  removeIngredient(index: number): void {
    this.ingredients.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  updateIngredient(index: number, field: keyof RecipeIngredientRow, value: string | number): void {
    this.ingredients.update((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  }

  updateRecipeName(value: string): void {
    this.name = value;
    if (!this.isEditing) {
      this.selectedRecipeId = null;
      this.recipeId = null;
    }
    this.refreshRecipeMatches();
  }
  ingredientMatches(index: number): SharedIngredient[] {
    const query = this.ingredients()[index]?.ingredientName ?? '';
    return this.catalog.search(query);
  }
  canCreateIngredient(index: number): boolean {
    const query = this.ingredients()[index]?.ingredientName.trim() ?? '';
    return query.length >= 3 && !this.ingredientMatches(index).length;
  }

  selectIngredient(index: number, ingredient: SharedIngredient): void {
    this.ingredients.update((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, ingredientId: ingredient.id, ingredientName: ingredient.name }
          : item,
      ),
    );
  }

  createIngredient(index: number): void {
    const row = this.ingredients()[index];
    if (!row) return;
    const name = row.ingredientName.trim();
    if (name.length < 3) return;

    const created = this.catalog.add(name);
    if (!created) return;

    this.selectIngredient(index, created);
  }

  clearIngredient(index: number): void {
    this.ingredients.update((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ingredientId: '', ingredientName: '' } : item,
      ),
    );
  }

  canCreateRecipe(): boolean {
    return !this.isEditing && this.name.trim().length >= 3 && !this.recipeMatches().length;
  }

  selectRecipe(recipe: Recipe): void {
    this.selectedRecipeId = recipe.id;
    this.name = recipe.name;
    this.servings = recipe.servings;
    this.ingredients.set(
      Object.entries(recipe.ingredients).map(([ingredientId, quantity]) => ({
        ingredientId,
        ingredientName: this.catalog.nameFor(ingredientId),
        quantity,
        })),
      );
    this.refreshRecipeMatches();
  }

  clearSelectedRecipe(): void {
    this.selectedRecipeId = null;
    this.recipeId = null;
    this.name = '';
    this.servings = 1;
    this.ingredients.set([{ ingredientId: '', ingredientName: '', quantity: 1 }]);
    this.refreshRecipeMatches();
  }

  save(): void {
    const ingredients = this.ingredients()
      .map((item) => this.resolveIngredient(item))
      .filter((item): item is { id: string; quantity: number } => !!item && item.quantity > 0)
      .reduce<Record<string, number>>((next, item) => {
        next[item.id] = (next[item.id] ?? 0) + Math.floor(item.quantity);
        return next;
      }, {});
    if (!this.name.trim() || !Object.keys(ingredients).length || this.servings < 1) return;
    this.saved.emit({
      id: this.recipeId ?? this.selectedRecipeId,
      recipe: { name: this.name.trim(), servings: this.servings, image: '', ingredients },
    });
  }

  private resolveIngredient(
    item: RecipeIngredientRow,
  ): { id: string; quantity: number } | null {
    if (!item.quantity || item.quantity < 1) return null;
    const trimmed = item.ingredientName.trim();
    const ingredientId = item.ingredientId.trim();
    if (ingredientId) return { id: ingredientId, quantity: item.quantity };
    if (!trimmed) return null;

    const exact = this.catalog.findByName(trimmed);
    if (exact) return { id: exact.id, quantity: item.quantity };

    const created = this.catalog.add(trimmed);
    if (!created) return null;
    return { id: created.id, quantity: item.quantity };
  }

  private refreshRecipeMatches(): void {
    const query = this.name.trim();
    if (this.isEditing || query.length < 3) {
      this.recipeMatches.set([]);
      return;
    }

    const needle = query.toLowerCase();
    this.recipeMatches.set(
      this.menu.availableRecipes()
        .filter((recipe) => recipe.name.toLowerCase().includes(needle))
        .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }))
        .slice(0, 8),
    );
  }
}

import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { IngredientCatalogService } from '../../data/ingredient-catalog.service';
import { DataService } from '../../data/data.service';
import { defaultPantryIngredients } from '../../data/data-seeding/seed-data';
import { USER_COLLECTIONS, USER_DATA_DOCS } from '../../data/user-data';

export interface PantryIngredient {
  id: string;
  name: string;
  image?: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class PantryService {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);
  private readonly catalog = inject(IngredientCatalogService);
  private readonly state = signal<PantryIngredient[]>(this.read());
  readonly ingredients = computed(() => this.state());

  constructor() {
    effect(() => {
      this.data.revision();
      if (!this.auth.ready()) return;
      this.auth.user();
      void this.refresh();
    });
  }

  add(ingredientId: string, quantity: number): boolean {
    const ingredient = this.ingredientsCatalog().find((item) => item.id === ingredientId);
    if (!ingredient || quantity < 1 || this.state().some((item) => item.id === ingredientId))
      return false;
    const next = [...this.state(), { ...ingredient, quantity }];
    this.update(next);
    return true;
  }
  remove(id: string): void {
    this.update(this.state().filter((item) => item.id !== id));
  }
  setQuantity(id: string, quantity: number): boolean {
    if (!Number.isInteger(quantity) || quantity < 0 || !this.state().some((item) => item.id === id))
      return false;
    this.update(this.state().map((item) => (item.id === id ? { ...item, quantity } : item)));
    return true;
  }
  reset(): void {
    this.update(defaultPantryIngredients());
  }

  private read(): PantryIngredient[] {
    const saved = this.data.readDocument<Record<string, number>>(
      USER_COLLECTIONS.data,
      USER_DATA_DOCS.ingredients,
      Object.fromEntries(defaultPantryIngredients().map((ingredient) => [ingredient.id, ingredient.quantity])),
    );
    return Object.entries(saved).flatMap(([id, quantity]) => {
      const ingredient = this.ingredientsCatalog().find((item) => item.id === id);
      if (!ingredient) return [];
      return [{ ...ingredient, quantity: Math.max(0, Math.floor(quantity)) }];
    });
  }
  private update(ingredients: PantryIngredient[]): void {
    this.state.set(ingredients);
    this.data.upsertDocument(
      USER_COLLECTIONS.data,
      USER_DATA_DOCS.ingredients,
      Object.fromEntries(ingredients.map((ingredient) => [ingredient.id, ingredient.quantity])),
    );
  }

  private async refresh(): Promise<void> {
    await this.data.whenReady();
    this.state.set(this.read());
  }

  private ingredientsCatalog() {
    return this.catalog.ingredients();
  }
}

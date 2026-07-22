import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ApiClientService } from '../../api/api-client.service';
import { IngredientCatalogService } from '../../data/ingredient-catalog.service';
import { defaultPantryIngredients } from '../../data/data-seeding/seed-data';

export interface PantryIngredient {
  id: string;
  name: string;
  image?: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class PantryService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiClientService);
  private readonly catalog = inject(IngredientCatalogService);
  private readonly state = signal<PantryIngredient[]>([]);
  readonly ingredients = computed(() => this.state());

  constructor() {
    effect(() => {
      if (!this.auth.ready()) return;
      this.auth.user();
      void this.refresh();
    });
  }

  async add(ingredientId: string, quantity: number): Promise<boolean> {
    const ingredient = this.ingredientsCatalog().find((item) => item.id === ingredientId);
    if (!ingredient || quantity < 1)
      return false;

    await this.api.addPantryIngredient(ingredientId, quantity);
    await this.refresh();
    return true;
  }
  async remove(id: string): Promise<void> {
    await this.api.removePantryIngredient(id);
    await this.refresh();
  }
  async setQuantity(id: string, quantity: number): Promise<boolean> {
    if (!Number.isInteger(quantity) || quantity < 0 || !this.state().some((item) => item.id === id))
      return false;
    await this.api.setPantryIngredient(id, quantity);
    await this.refresh();
    return true;
  }
  async reset(): Promise<void> {
    await this.api.replacePantry(
      Object.fromEntries(defaultPantryIngredients().map((ingredient) => [ingredient.id, ingredient.quantity])),
    );
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    try {
      const pantry = await this.api.getPantry();
      const ingredients = Object.entries(pantry.values).flatMap(([id, quantity]) => {
        const ingredient = this.ingredientsCatalog().find((item) => item.id === id);
        if (!ingredient) return [];
        return [{ ...ingredient, quantity: Math.max(0, Math.floor(quantity)) }];
      });
      this.state.set(ingredients);
    } catch (error) {
      console.error('Failed to load pantry from API:', error);
    }
  }

  private ingredientsCatalog() {
    return this.catalog.ingredients();
  }
}

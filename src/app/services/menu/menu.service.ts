import { Injectable, computed, inject, signal } from '@angular/core';
import { DataService } from '../data/data.service';
import { DATA_KEYS, defaultRecipes } from '../data-seeding/seed-data';

export interface RecipeIngredient {
  name: string;
  quantity: number;
}
export interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: RecipeIngredient[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly data = inject(DataService);
  private readonly storageKey = DATA_KEYS.menu;
  private readonly recipeState = signal<Recipe[]>(this.readRecipes());
  readonly recipes = computed(() => this.recipeState());

  add(recipe: Omit<Recipe, 'id'>): void {
    this.update([...this.recipeState(), { ...recipe, id: crypto.randomUUID() }]);
  }

  find(id: string): Recipe | undefined {
    return this.recipeState().find((recipe) => recipe.id === id);
  }

  updateRecipe(id: string, recipe: Omit<Recipe, 'id'>): void {
    this.update(
      this.recipeState().map((current) => (current.id === id ? { ...recipe, id } : current)),
    );
  }

  remove(id: string): void {
    this.update(this.recipeState().filter((recipe) => recipe.id !== id));
  }

  reset(): void {
    this.update(defaultRecipes());
  }

  private readRecipes(): Recipe[] {
    return this.data.read(this.storageKey, defaultRecipes());
  }
  private update(recipes: Recipe[]): void {
    this.recipeState.set(recipes);
    this.data.write(this.storageKey, recipes);
  }
}

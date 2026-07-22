import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { DataService } from '../../data/data.service';
import { GLOBAL_COLLECTIONS, USER_COLLECTIONS, USER_DATA_DOCS } from '../../data/user-data';
import { defaultRecipes } from '../../data/data-seeding/seed-data';
import { Recipe } from '../../data/shared-types';

interface RecipeSelectionDoc {
  values: string[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);
  private readonly allRecipesState = signal<Recipe[]>(this.readRecipes());
  private readonly selectedRecipeIdsState = signal<string[]>(this.readSelection());
  readonly recipes = computed(() => this.sortRecipes(this.allRecipesState().filter((recipe) => this.selectedRecipeIdsState().includes(recipe.id))));
  readonly availableRecipes = computed(() => this.sortRecipes(this.allRecipesState().filter((recipe) => !this.selectedRecipeIdsState().includes(recipe.id))));
  readonly allRecipes = computed(() => this.sortRecipes(this.allRecipesState()));
  readonly selectedRecipeIds = computed(() => this.selectedRecipeIdsState());

  constructor() {
    effect(() => {
      this.data.revision();
      if (!this.auth.ready()) return;
      this.auth.user();
      void this.refresh();
    });
  }

  add(recipe: Omit<Recipe, 'id'>): void {
    const id = this.data.createDocument(GLOBAL_COLLECTIONS.recipes, recipe, 'global');
    const nextRecipe = { ...recipe, id };
    this.allRecipesState.set([...this.allRecipesState(), nextRecipe]);
    this.updateSelection([...this.selectedRecipeIdsState(), id]);
  }

  find(id: string): Recipe | undefined {
    return this.allRecipesState().find((recipe) => recipe.id === id);
  }

  updateRecipe(id: string, recipe: Omit<Recipe, 'id'>): void {
    this.allRecipesState.update((recipes) =>
      recipes.map((current) => (current.id === id ? { ...recipe, id } : current)),
    );
    this.data.upsertDocument(GLOBAL_COLLECTIONS.recipes, id, recipe, 'global');
    this.select(id);
  }

  remove(id: string): void {
    this.updateSelection(this.selectedRecipeIdsState().filter((recipeId) => recipeId !== id));
  }

  select(id: string): void {
    if (this.selectedRecipeIdsState().includes(id)) return;
    this.updateSelection([...this.selectedRecipeIdsState(), id]);
  }

  reset(): void {
    this.allRecipesState.set(this.readRecipes());
    this.updateSelection(defaultRecipes().map((recipe) => recipe.id));
  }

  private readRecipes(): Recipe[] {
    return this.data.readCollection(GLOBAL_COLLECTIONS.recipes, defaultRecipes(), 'global');
  }

  private readSelection(): string[] {
    return this.data.readDocument<RecipeSelectionDoc>(
      USER_COLLECTIONS.data,
      USER_DATA_DOCS.recipes,
      { values: defaultRecipes().map((recipe) => recipe.id) },
    ).values;
  }

  private updateSelection(values: string[]): void {
    const next = Array.from(new Set(values));
    this.selectedRecipeIdsState.set(next);
    this.data.upsertDocument(USER_COLLECTIONS.data, USER_DATA_DOCS.recipes, { values: next });
  }

  private async refresh(): Promise<void> {
    await this.data.whenReady();
    this.allRecipesState.set(this.readRecipes());
    this.selectedRecipeIdsState.set(this.readSelection());
  }

  private sortRecipes(recipes: Recipe[]): Recipe[] {
    return [...recipes].sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
  }
}

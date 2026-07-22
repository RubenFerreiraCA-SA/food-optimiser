import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { DataService } from '../../data/data.service';
import { defaultRecipes } from '../../data/data-seeding/seed-data';
import { GLOBAL_COLLECTIONS, USER_COLLECTIONS, USER_DATA_DOCS } from '../../data/user-data';
import { Recipe } from '../../data/shared-types';

interface RecipeSelectionDoc {
  values: string[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);
  private readonly sharedRecipesState = signal<Recipe[]>(this.readSharedRecipes());
  private readonly userRecipesState = signal<Recipe[]>(this.readUserRecipes());
  private readonly selectedRecipeIdsState = signal<string[]>(this.readSelection());

  readonly recipes = computed(() =>
    this.sortRecipes(
      this.selectedRecipeIdsState()
        .map((recipeId) => this.userRecipesState().find((recipe) => recipe.id === recipeId))
        .filter((recipe): recipe is Recipe => !!recipe),
    ),
  );
  readonly availableRecipes = computed(() =>
    this.sortRecipes(
      this.sharedRecipesState().filter((recipe) => !this.selectedSharedRecipeIds().has(recipe.id)),
    ),
  );
  readonly allRecipes = computed(() => this.sortRecipes(this.userRecipesState()));
  readonly selectedRecipeIds = computed(() => this.selectedRecipeIdsState());

  constructor() {
    effect(() => {
      this.data.revision();
      if (!this.auth.ready()) return;
      this.auth.user();
      void this.refresh();
    });
  }

  add(recipe: Omit<Recipe, 'id'>, sourceRecipeId: string | null = null): void {
    const storedRecipe: Omit<Recipe, 'id'> = {
      ...recipe,
      origin: sourceRecipeId ? 'forked' : recipe.origin ?? 'custom',
      ...(sourceRecipeId ? { sourceRecipeId } : {}),
    };
    const id = this.data.createDocument(USER_COLLECTIONS.recipes, storedRecipe);
    const nextRecipe = { ...storedRecipe, id };
    this.userRecipesState.set([...this.userRecipesState(), nextRecipe]);
    this.updateSelection([...this.selectedRecipeIdsState(), id]);
  }

  fork(recipe: Recipe): void {
    this.add(
      {
        name: recipe.name,
        servings: recipe.servings,
        image: recipe.image,
        ingredients: { ...recipe.ingredients },
        origin: 'forked',
        sourceRecipeId: recipe.id,
      },
      recipe.id,
    );
  }

  find(id: string): Recipe | undefined {
    return this.userRecipesState().find((recipe) => recipe.id === id);
  }

  updateRecipe(id: string, recipe: Omit<Recipe, 'id'>): void {
    const current = this.find(id);
    const nextOrigin: Recipe['origin'] =
      current?.origin === 'shared'
        ? 'forked'
        : current?.origin ?? (current?.sourceRecipeId ? 'forked' : 'custom');
    const nextRecipe: Omit<Recipe, 'id'> = {
      ...recipe,
      origin: nextOrigin,
      ...(current?.sourceRecipeId ? { sourceRecipeId: current.sourceRecipeId } : {}),
    };
    this.userRecipesState.update((recipes) =>
      recipes.map((stored) => (stored.id === id ? { ...nextRecipe, id } : stored)),
    );
    this.data.upsertDocument(USER_COLLECTIONS.recipes, id, nextRecipe);
    this.select(id);
  }

  remove(id: string): void {
    this.userRecipesState.update((recipes) => recipes.filter((recipe) => recipe.id !== id));
    this.updateSelection(this.selectedRecipeIdsState().filter((recipeId) => recipeId !== id));
    this.data.deleteDocument(USER_COLLECTIONS.recipes, id);
  }

  select(id: string): void {
    if (this.selectedRecipeIdsState().includes(id)) return;
    this.updateSelection([...this.selectedRecipeIdsState(), id]);
  }

  reset(): void {
    const recipes = this.data.replaceCollection(
      USER_COLLECTIONS.recipes,
      defaultRecipes().map((recipe) => ({
        ...recipe,
        origin: 'shared' as const,
        sourceRecipeId: recipe.id,
      })),
    );
    this.userRecipesState.set(recipes);
    this.updateSelection(recipes.map((recipe) => recipe.id));
  }

  private readSharedRecipes(): Recipe[] {
    return this.data.readCollection(GLOBAL_COLLECTIONS.recipes, defaultRecipes(), 'global');
  }

  private readUserRecipes(): Recipe[] {
    return this.data.readCollection(USER_COLLECTIONS.recipes, [], 'user');
  }

  private readSelection(): string[] {
    return this.data.readDocument<RecipeSelectionDoc>(USER_COLLECTIONS.data, USER_DATA_DOCS.recipes, {
      values: [],
    }).values;
  }

  private updateSelection(values: string[]): void {
    const next = Array.from(new Set(values));
    this.selectedRecipeIdsState.set(next);
    this.data.upsertDocument(USER_COLLECTIONS.data, USER_DATA_DOCS.recipes, { values: next });
  }

  private async refresh(): Promise<void> {
    await this.data.whenReady();
    this.sharedRecipesState.set(this.readSharedRecipes());
    this.userRecipesState.set(this.readUserRecipes());
    this.selectedRecipeIdsState.set(this.readSelection());
  }

  private selectedSharedRecipeIds(): Set<string> {
    const ids = new Set<string>();
    for (const recipeId of this.selectedRecipeIdsState()) {
      const recipe = this.userRecipesState().find((item) => item.id === recipeId);
      if (!recipe) continue;
      const sharedId = recipe.sourceRecipeId ?? (recipe.origin === 'shared' ? recipe.id : null);
      if (sharedId) ids.add(sharedId);
    }
    return ids;
  }

  private sortRecipes(recipes: Recipe[]): Recipe[] {
    return [...recipes].sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
    );
  }
}

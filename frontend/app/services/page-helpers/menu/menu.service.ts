import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ApiClientService } from '../../api/api-client.service';
import { Recipe } from '../../data/shared-types';
import { SnackbarService } from '../../ui/snackbar.service';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiClientService);
  private readonly snackbar = inject(SnackbarService);
  private readonly sharedRecipesState = signal<Recipe[]>([]);
  private readonly userRecipesState = signal<Recipe[]>([]);
  private readonly selectedRecipeIdsState = signal<string[]>([]);

  readonly recipes = computed(() =>
    this.sortRecipes(
      this.selectedRecipeIdsState()
        .map((recipeId) => this.findRecipe(recipeId))
        .filter((recipe): recipe is Recipe => !!recipe),
    ),
  );
  readonly availableRecipes = computed(() =>
    this.sortRecipes(this.sharedRecipesState().filter((recipe) => !this.selectedRecipeIdsSet().has(recipe.id))),
  );
  readonly allRecipes = computed(() =>
    this.sortRecipes(this.mergeRecipes(this.sharedRecipesState(), this.userRecipesState())),
  );
  readonly selectedRecipeIds = computed(() => this.selectedRecipeIdsState());

  constructor() {
    effect(() => {
      if (!this.auth.ready()) return;
      this.auth.user();
      void this.refresh();
    });
  }

  async add(recipe: Omit<Recipe, 'id'>, sourceRecipeId: string | null = null): Promise<void> {
    const storedRecipe: Omit<Recipe, 'id'> = {
      ...recipe,
      origin: sourceRecipeId ? 'forked' : recipe.origin ?? 'custom',
      ...(sourceRecipeId ? { sourceRecipeId } : {}),
    };
    const created = await this.api.createPersonalRecipe(this.toUpsertRecipe(storedRecipe));
    await this.api.addMenuRecipe(created.id);
    await this.refresh();
    this.snackbar.success('Recipe added');
  }

  async fork(recipe: Recipe): Promise<void> {
    await this.add(
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
    return this.findRecipe(id);
  }

  async updateRecipe(id: string, recipe: Omit<Recipe, 'id'>): Promise<void> {
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
    await this.api.updatePersonalRecipe(id, this.toUpsertRecipe(nextRecipe));
    await this.api.addMenuRecipe(id);
    await this.refresh();
    this.snackbar.success('Recipe updated');
  }

  async remove(id: string): Promise<void> {
    const isPersonalRecipe = this.userRecipesState().some((recipe) => recipe.id === id);
    if (isPersonalRecipe) {
      await this.api.deletePersonalRecipe(id);
    } else {
      await this.api.removeMenuRecipe(id);
    }
    await this.refresh();
    this.snackbar.success('Recipe removed');
  }

  async select(id: string): Promise<void> {
    if (this.selectedRecipeIdsState().includes(id)) return;
    await this.api.addMenuRecipe(id);
    await this.refresh();
  }

  async reset(): Promise<void> {
    const personalRecipes = await this.api.getPersonalRecipes();
    for (const recipe of personalRecipes) {
      await this.api.deletePersonalRecipe(recipe.id);
    }
    const sharedRecipes = await this.api.getRecipes();
    await this.api.replaceMenu(sharedRecipes.map((recipe) => recipe.id));
    await this.refresh();
    this.snackbar.success('Menu restored');
  }

  private findRecipe(id: string): Recipe | undefined {
    return this.userRecipesState().find((recipe) => recipe.id === id) ??
      this.sharedRecipesState().find((recipe) => recipe.id === id);
  }

  private mergeRecipes(...groups: Recipe[][]): Recipe[] {
    return groups.flat().filter((recipe, index, all) => all.findIndex((item) => item.id === recipe.id) === index);
  }

  private selectedRecipeIdsSet(): Set<string> {
    return new Set(this.selectedRecipeIdsState());
  }

  private toUpsertRecipe(recipe: Omit<Recipe, 'id'>) {
    return {
      name: recipe.name,
      servings: recipe.servings,
      image: recipe.image,
      ingredients: { ...recipe.ingredients },
      sourceRecipeId: recipe.sourceRecipeId ?? null,
    };
  }

  private async refresh(): Promise<void> {
    try {
      const [sharedRecipes, userRecipes, menu] = await Promise.all([
        this.api.getRecipes(),
        this.api.getPersonalRecipes(),
        this.api.getMenu(),
      ]);
      this.sharedRecipesState.set(this.sortRecipes(sharedRecipes));
      this.userRecipesState.set(this.sortRecipes(userRecipes));
      this.selectedRecipeIdsState.set(menu.selectedRecipeIds);
    } catch (error) {
      console.error('Failed to load menu from API:', error);
    }
  }

  private sortRecipes(recipes: Recipe[]): Recipe[] {
    return [...recipes].sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
    );
  }
}

import { computed, effect, Injectable, inject, signal } from '@angular/core';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { SnackbarService } from '../../core/ui/snackbar.service';
import { Recipe } from '../../domain/models';
import { RecipeCatalogService } from '../../domain/recipes/recipe-catalog.service';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiClientService);
  private readonly catalog = inject(RecipeCatalogService);
  private readonly snackbar = inject(SnackbarService);
  private readonly selectedRecipeIdsState = signal<string[]>([]);

  readonly recipes = computed(() =>
    this.selectedRecipeIdsState()
      .map((recipeId) => this.catalog.find(recipeId))
      .filter((recipe): recipe is Recipe => !!recipe),
  );
  readonly availableRecipes = computed(() =>
    this.catalog.sharedRecipes().filter((recipe) => !this.selectedRecipeIdsSet().has(recipe.id)),
  );
  readonly allRecipes = computed(() => this.catalog.recipes());
  readonly selectedRecipeIds = computed(() => this.selectedRecipeIdsState());

  constructor() {
    effect(() => {
      if (!this.auth.ready()) return;
      this.auth.user();
      void this.refreshMenu();
    });
  }

  find(id: string): Recipe | undefined {
    return this.catalog.find(id);
  }

  async add(recipe: Omit<Recipe, 'id'>, sourceRecipeId: string | null = null): Promise<void> {
    await this.catalog.add({
      ...recipe,
      origin: sourceRecipeId ? 'forked' : (recipe.origin ?? 'custom'),
      ...(sourceRecipeId ? { sourceRecipeId } : {}),
    });
    await this.refreshMenu();
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

  async updateRecipe(id: string, recipe: Omit<Recipe, 'id'>): Promise<void> {
    const current = this.find(id);
    const nextRecipe: Omit<Recipe, 'id'> = {
      ...recipe,
      origin: current?.origin === 'shared' ? 'forked' : (current?.origin ?? 'custom'),
      ...(current?.sourceRecipeId ? { sourceRecipeId: current.sourceRecipeId } : {}),
    };
    await this.catalog.update(id, nextRecipe);
    await this.refreshMenu();
    this.snackbar.success('Recipe updated');
  }

  async remove(id: string): Promise<void> {
    if (this.catalog.isPersonal(id)) await this.catalog.remove(id);
    else await this.api.removeMenuRecipe(id);
    await this.refreshMenu();
    this.snackbar.success('Recipe removed');
  }

  async select(id: string): Promise<void> {
    if (this.selectedRecipeIdsState().includes(id)) return;
    await this.api.addMenuRecipe(id);
    await this.refreshMenu();
  }

  async reset(): Promise<void> {
    for (const recipe of this.catalog.personalRecipes()) await this.catalog.remove(recipe.id);
    const sharedRecipes = this.catalog.sharedRecipes();
    await this.api.replaceMenu(sharedRecipes.map((recipe) => recipe.id));
    await Promise.all([this.catalog.refresh(), this.refreshMenu()]);
    this.snackbar.success('Menu restored');
  }

  private async refreshMenu(): Promise<void> {
    try {
      const menu = await this.api.getMenu();
      this.selectedRecipeIdsState.set(menu.selectedRecipeIds);
    } catch (error) {
      console.error('Failed to load menu from API:', error);
    }
  }

  private selectedRecipeIdsSet(): Set<string> {
    return new Set(this.selectedRecipeIdsState());
  }
}

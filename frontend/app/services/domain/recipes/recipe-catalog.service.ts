import { computed, effect, Injectable, inject, signal } from '@angular/core';
import { ApiClientService, type UpsertRecipeRequest } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { Recipe } from '../models';

@Injectable({ providedIn: 'root' })
export class RecipeCatalogService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiClientService);
  private readonly sharedState = signal<Recipe[]>([]);
  private readonly personalState = signal<Recipe[]>([]);

  readonly sharedRecipes = computed(() => this.sharedState());
  readonly personalRecipes = computed(() => this.personalState());
  readonly recipes = computed(() => this.mergeRecipes(this.sharedState(), this.personalState()));

  constructor() {
    effect(() => {
      if (!this.auth.ready()) return;
      this.auth.user();
      void this.refresh();
    });
  }

  find(id: string): Recipe | undefined {
    return this.recipes().find((recipe) => recipe.id === id);
  }

  isPersonal(id: string): boolean {
    return this.personalState().some((recipe) => recipe.id === id);
  }

  async add(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    const created = await this.api.createPersonalRecipe(this.toUpsertRequest(recipe));
    await this.refresh();
    return created;
  }

  async update(id: string, recipe: Omit<Recipe, 'id'>): Promise<void> {
    await this.api.updatePersonalRecipe(id, this.toUpsertRequest(recipe));
    await this.refresh();
  }

  async remove(id: string): Promise<void> {
    await this.api.deletePersonalRecipe(id);
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const [sharedRecipes, personalRecipes] = await Promise.all([
        this.api.getRecipes(),
        this.api.getPersonalRecipes(),
      ]);
      this.sharedState.set(this.sortRecipes(sharedRecipes));
      this.personalState.set(this.sortRecipes(personalRecipes));
    } catch (error) {
      console.error('Failed to load recipe catalog from API:', error);
    }
  }

  private toUpsertRequest(recipe: Omit<Recipe, 'id'>): UpsertRecipeRequest {
    return {
      name: recipe.name,
      servings: recipe.servings,
      image: recipe.image,
      ingredients: { ...recipe.ingredients },
      sourceRecipeId: recipe.sourceRecipeId ?? null,
    };
  }

  private mergeRecipes(...groups: Recipe[][]): Recipe[] {
    return this.sortRecipes(
      groups
        .flat()
        .filter((recipe, index, all) => all.findIndex((item) => item.id === recipe.id) === index),
    );
  }

  private sortRecipes(recipes: Recipe[]): Recipe[] {
    return [...recipes].sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
    );
  }
}

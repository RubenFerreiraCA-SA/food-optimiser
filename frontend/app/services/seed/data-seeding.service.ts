import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../core/api/api-client.service';
import { AuthService } from '../core/auth/auth.service';
import { Recipe } from '../domain/models';
import { defaultIngredients, defaultPantryIngredients, defaultRecipes } from './seed-data';

/** Seeds the backend with starter data when an authenticated account is empty. */
@Injectable({ providedIn: 'root' })
export class DataSeedingService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiClientService);

  async seed(): Promise<void> {
    if (!this.auth.ready() || !this.auth.isAuthenticated()) return;

    const ingredientIds = await this.seedIngredients();
    await this.seedSharedRecipes(ingredientIds);
    const personalRecipeIds = await this.seedPersonalRecipes(ingredientIds);
    await this.seedPantry(ingredientIds);
    await this.seedMenu(personalRecipeIds);
  }

  private async seedIngredients(): Promise<Map<string, string>> {
    const ingredients = await this.api.getIngredients();
    const byName = new Map(
      ingredients.map((ingredient) => [this.normalizedName(ingredient.name), ingredient]),
    );

    for (const seed of defaultIngredients()) {
      const key = this.normalizedName(seed.name);
      if (!byName.has(key))
        byName.set(key, await this.api.createIngredient({ name: seed.name, image: seed.image }));
    }

    return new Map(
      defaultIngredients().map((seed) => [seed.id, byName.get(this.normalizedName(seed.name))!.id]),
    );
  }

  private async seedSharedRecipes(ingredientIds: Map<string, string>): Promise<void> {
    if ((await this.api.getRecipes()).length > 0) return;
    await Promise.all(
      defaultRecipes().map((recipe) =>
        this.api.createRecipe(this.recipeRequest(recipe, ingredientIds)),
      ),
    );
  }

  private async seedPersonalRecipes(ingredientIds: Map<string, string>): Promise<string[]> {
    const existing = await this.api.getPersonalRecipes();
    if (existing.length > 0) return existing.map((recipe) => recipe.id);

    const recipes = await Promise.all(
      defaultRecipes().map((recipe) =>
        this.api.createPersonalRecipe(this.recipeRequest(recipe, ingredientIds)),
      ),
    );
    return recipes.map((recipe) => recipe.id);
  }

  private async seedPantry(ingredientIds: Map<string, string>): Promise<void> {
    const pantry = await this.api.getPantry();
    if (Object.keys(pantry.values).length > 0) return;

    await this.api.replacePantry(
      Object.fromEntries(
        defaultPantryIngredients().map((ingredient) => [
          ingredientIds.get(ingredient.id)!,
          ingredient.quantity,
        ]),
      ),
    );
  }

  private async seedMenu(personalRecipeIds: string[]): Promise<void> {
    const menu = await this.api.getMenu();
    if (menu.selectedRecipeIds.length === 0) await this.api.replaceMenu(personalRecipeIds);
  }

  private recipeRequest(recipe: Recipe, ingredientIds: Map<string, string>) {
    return {
      name: recipe.name,
      servings: recipe.servings,
      image: recipe.image,
      ingredients: Object.fromEntries(
        Object.entries(recipe.ingredients).map(([id, quantity]) => [
          ingredientIds.get(id)!,
          quantity,
        ]),
      ),
      sourceRecipeId: recipe.sourceRecipeId ?? null,
    };
  }

  private normalizedName(name: string): string {
    return name.trim().toLowerCase();
  }
}

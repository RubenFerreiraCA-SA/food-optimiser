import { Injectable, computed, signal } from '@angular/core';
import { ApiClientService } from '../../api/api-client.service';
import type { Recipe } from '../../data/shared-types';
import { SnackbarService } from '../../ui/snackbar.service';

export interface PlannerIngredientInput {
  id: string;
  name: string;
  quantity: number;
}

export interface OptimisedPlanMeal {
  recipeId: string;
  name: string;
  dishes: number;
  meals: number;
  ingredients: string;
}

export interface IngredientPlanUsage {
  id: string;
  name: string;
  before: number;
  used: number;
  left: number;
}

export interface OptimisedPlan {
  meals: OptimisedPlanMeal[];
  totalDishes: number;
  totalMeals: number;
  ingredients: IngredientPlanUsage[];
}

type PlannerRecipeInput = Pick<Recipe, 'id' | 'name' | 'servings'> & {
  ingredients:
    | Record<string, number>
    | Array<{
        name: string;
        quantity: number;
      }>;
};

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly api?: ApiClientService;
  private readonly snackbar?: SnackbarService;
  private readonly planState = signal<OptimisedPlan | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal('');

  readonly plan = computed(() => this.planState());
  readonly loading = computed(() => this.loadingState());
  readonly error = computed(() => this.errorState());

  constructor(api?: ApiClientService, snackbar?: SnackbarService) {
    this.api = api;
    this.snackbar = snackbar;
  }

  async createPlan(
    availableIngredients: PlannerIngredientInput[],
    recipes: Recipe[],
  ): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set('');

    try {
      const plan = this.api
        ? await this.api.createPlan({
            availableIngredients: availableIngredients.map((ingredient) => ({
              id: ingredient.id,
              name: ingredient.name,
              quantity: this.toQuantity(ingredient.quantity),
            })),
            recipes: recipes.map((recipe) => ({
              id: recipe.id,
              name: recipe.name,
              servings: recipe.servings,
              image: recipe.image,
              ingredients: { ...recipe.ingredients },
            })),
          })
        : this.optimise(availableIngredients, recipes);

      this.planState.set(plan);
      this.snackbar?.success('Plan ready');
    } catch (error) {
      console.error('Failed to create plan from API:', error);
      this.errorState.set('Unable to create a plan right now. Please try again.');
      this.planState.set(null);
    } finally {
      this.loadingState.set(false);
    }
  }

  clear(): void {
    this.planState.set(null);
    this.errorState.set('');
    this.loadingState.set(false);
  }

  optimise(availableIngredients: PlannerIngredientInput[], recipes: PlannerRecipeInput[]): OptimisedPlan {
    const normalizedIngredients = availableIngredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      quantity: this.toQuantity(ingredient.quantity),
    }));
    const ingredientLookup = this.createIngredientLookup(normalizedIngredients);
    const normalizedRecipes = recipes.map((recipe, index) => ({
      index,
      id: recipe.id,
      name: recipe.name,
      servings: this.toQuantity(recipe.servings),
      ingredients: this.normalizeRecipeIngredients(recipe.ingredients, ingredientLookup, normalizedIngredients),
    }));

    const order = [...normalizedRecipes.keys()].sort((left, right) => {
      const leftRecipe = normalizedRecipes[left];
      const rightRecipe = normalizedRecipes[right];
      if (leftRecipe.servings !== rightRecipe.servings)
        return rightRecipe.servings - leftRecipe.servings;
      return leftRecipe.name.localeCompare(rightRecipe.name, undefined, { sensitivity: 'base' });
    });
    const orderedRecipes = order.map((index) => normalizedRecipes[index]);

    let bestCounts = new Array<number>(orderedRecipes.length).fill(0);
    let bestMeals = -1;
    let bestDishes = -1;

    const remaining = normalizedIngredients.map((ingredient) => ingredient.quantity);
    const currentCounts = new Array<number>(orderedRecipes.length).fill(0);

    const search = (recipeIndex: number, currentMeals: number, currentDishes: number): void => {
      const optimisticMeals = currentMeals + this.upperBoundMeals(orderedRecipes, recipeIndex, remaining);
      if (optimisticMeals < bestMeals) return;

      if (recipeIndex >= orderedRecipes.length) {
        if (
          currentMeals > bestMeals ||
          (currentMeals === bestMeals && currentDishes > bestDishes)
        ) {
          bestMeals = currentMeals;
          bestDishes = currentDishes;
          bestCounts = [...currentCounts];
        }
        return;
      }

      const recipe = orderedRecipes[recipeIndex];
      const maxDishes = this.maxDishesForRecipe(recipe.ingredients, remaining);

      for (let dishes = maxDishes; dishes >= 0; dishes -= 1) {
        this.applyRecipe(remaining, recipe.ingredients, -dishes);
        currentCounts[recipeIndex] = dishes;
        search(recipeIndex + 1, currentMeals + dishes * recipe.servings, currentDishes + dishes);
        currentCounts[recipeIndex] = 0;
        this.applyRecipe(remaining, recipe.ingredients, dishes);
      }
    };

    search(0, 0, 0);

    const selectedMeals = orderedRecipes
      .map((recipe, index) => ({
        recipe,
        dishes: bestCounts[index],
      }))
      .filter(({ dishes }) => dishes > 0)
      .sort((left, right) => left.recipe.index - right.recipe.index)
      .map(({ recipe, dishes }) => ({
        recipeId: recipe.id,
        name: recipe.name,
        dishes,
        meals: dishes * recipe.servings,
        ingredients: recipe.ingredients
          .map((ingredient) => `${ingredient.name}: ${ingredient.quantity * dishes}`)
          .join(', '),
      }));

    const usedByName = new Map<string, number>();
    for (const meal of selectedMeals) {
      const recipe = normalizedRecipes.find((item) => item.id === meal.recipeId);
      if (!recipe) continue;
      for (const ingredient of recipe.ingredients) {
        if (ingredient.index < 0) continue;
        usedByName.set(
          ingredient.name,
          (usedByName.get(ingredient.name) ?? 0) + ingredient.quantity * meal.dishes,
        );
      }
    }

    return {
      meals: selectedMeals,
      totalDishes: selectedMeals.reduce((sum, meal) => sum + meal.dishes, 0),
      totalMeals: selectedMeals.reduce((sum, meal) => sum + meal.meals, 0),
      ingredients: normalizedIngredients.map((ingredient) => {
        const used = usedByName.get(ingredient.name) ?? 0;
        return {
          id: ingredient.id,
          name: ingredient.name,
          before: ingredient.quantity,
          used,
          left: Math.max(0, ingredient.quantity - used),
        };
      }),
    };
  }

  optimize(availableIngredients: PlannerIngredientInput[], recipes: PlannerRecipeInput[]): OptimisedPlan {
    return this.optimise(availableIngredients, recipes);
  }

  private toQuantity(quantity: number): number {
    return Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
  }

  private createIngredientLookup(ingredients: PlannerIngredientInput[]): Map<string, number> {
    const lookup = new Map<string, number>();
    for (const [index, ingredient] of ingredients.entries()) {
      lookup.set(ingredient.id.toLowerCase(), index);
      lookup.set(ingredient.name.toLowerCase(), index);
    }
    return lookup;
  }

  private normalizeRecipeIngredients(
    ingredients: PlannerRecipeInput['ingredients'],
    lookup: Map<string, number>,
    availableIngredients: PlannerIngredientInput[],
  ): Array<{ index: number; name: string; quantity: number }> {
    const entries =
      Array.isArray(ingredients)
        ? ingredients
        : Object.entries(ingredients).map(([name, quantity]) => ({ name, quantity }));

    return entries
      .map((ingredient) => {
        const index = lookup.get(ingredient.name.toLowerCase()) ?? -1;
        return {
          index,
          name: index >= 0 ? availableIngredients[index].name : ingredient.name,
          quantity: this.toQuantity(ingredient.quantity),
        };
      })
      .filter((ingredient) => ingredient.quantity > 0);
  }

  private maxDishesForRecipe(
    ingredients: Array<{
      index: number;
      name: string;
      quantity: number;
    }>,
    remaining: number[],
  ): number {
    if (ingredients.length === 0) return 0;
    let maxDishes = Number.POSITIVE_INFINITY;
    for (const ingredient of ingredients) {
      if (ingredient.index < 0) return 0;
      const available = remaining[ingredient.index];
      maxDishes = Math.min(maxDishes, Math.floor(available / ingredient.quantity));
    }
    return Number.isFinite(maxDishes) ? maxDishes : 0;
  }

  private applyRecipe(
    remaining: number[],
    ingredients: Array<{
      index: number;
      name: string;
      quantity: number;
    }>,
    multiplier: number,
  ): void {
    for (const ingredient of ingredients) {
      if (ingredient.index < 0) continue;
      remaining[ingredient.index] += ingredient.quantity * multiplier;
    }
  }

  private upperBoundMeals(
    recipes: Array<{
      servings: number;
      ingredients: Array<{
        index: number;
        name: string;
        quantity: number;
      }>;
    }>,
    startIndex: number,
    remaining: number[],
  ): number {
    return recipes.slice(startIndex).reduce((sum, recipe) => {
      const maxDishes = this.maxDishesForRecipe(recipe.ingredients, remaining);
      return sum + maxDishes * recipe.servings;
    }, 0);
  }
}

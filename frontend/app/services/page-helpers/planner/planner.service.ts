import { Injectable, computed, inject, signal } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly api = inject(ApiClientService);
  private readonly snackbar = inject(SnackbarService);
  private readonly planState = signal<OptimisedPlan | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal('');

  readonly plan = computed(() => this.planState());
  readonly loading = computed(() => this.loadingState());
  readonly error = computed(() => this.errorState());

  async createPlan(
    availableIngredients: PlannerIngredientInput[],
    recipes: Recipe[],
  ): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set('');

    try {
      const plan = await this.api.createPlan({
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
      });

      this.planState.set(plan);
      this.snackbar.success('Plan ready');
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

  private toQuantity(quantity: number): number {
    return Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { MenuService, Recipe } from '../../shared/services/menu.service';
import { PantryIngredient, PantryService } from '../../shared/services/pantry.service';
import { ConfirmIngredientsView } from './confirm-ingredients-view/confirm-ingredients-view';
import { ConfirmMenuView } from './confirm-menu-view/confirm-menu-view';
import { OptimisedPlanView } from './optimised-plan-view/optimised-plan-view';
import { PageHero, PageHeroConfig } from '../../shared/components/page-hero/page-hero';

export interface PlanningIngredient extends PantryIngredient {
  planningQuantity: number;
}

export interface PlannedMeal {
  name: string;
  servings: number;
  times: number;
  ingredients: string;
}

@Component({
  selector: 'app-planner-page',
  imports: [ConfirmIngredientsView, ConfirmMenuView, OptimisedPlanView, PageHero],
  templateUrl: './planner-page.html',
  styleUrl: './planner-page.scss',
})
export class PlannerPage {
  readonly pantry = inject(PantryService);
  readonly menu = inject(MenuService);
  readonly hero: PageHeroConfig = { eyebrow: 'Make the most of what you have', title: 'Plan your meals.', description: "We'll help you find the menu that makes your ingredients go furthest.", titleId: 'planner-title', markRotation: 12 };

  readonly step = signal(1);
  readonly planningIngredients = signal<PlanningIngredient[]>(this.createPlanningIngredients());
  readonly selectedRecipeIds = signal<string[]>(this.menu.recipes().map((recipe) => recipe.id));
  readonly selectedRecipes = computed(() =>
    this.menu.recipes().filter((recipe) => this.selectedRecipeIds().includes(recipe.id)),
  );
  readonly planMeals = computed(() => this.mockPlan());
  readonly totalServings = computed(() =>
    this.planMeals().reduce((sum, meal) => sum + meal.servings * meal.times, 0),
  );
  readonly totalMeals = computed(() => this.planMeals().reduce((sum, meal) => sum + meal.times, 0));

  updateIngredient(id: string, quantity: number): void {
    const validQuantity = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
    this.planningIngredients.update((ingredients) =>
      ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, planningQuantity: validQuantity } : ingredient,
      ),
    );
  }

  toggleRecipe(id: string): void {
    this.selectedRecipeIds.update((ids) =>
      ids.includes(id) ? ids.filter((recipeId) => recipeId !== id) : [...ids, id],
    );
  }

  continueToMenu(): void {
    this.step.set(2);
  }

  createPlan(): void {
    this.step.set(3);
  }

  goTo(step: number): void {
    if (step < this.step()) this.step.set(step);
  }

  startAgain(): void {
    this.planningIngredients.set(this.createPlanningIngredients());
    this.selectedRecipeIds.set(this.menu.recipes().map((recipe) => recipe.id));
    this.step.set(1);
  }

  private createPlanningIngredients(): PlanningIngredient[] {
    return this.pantry
      .ingredients()
      .map((ingredient) => ({ ...ingredient, planningQuantity: ingredient.quantity }));
  }

  private mockPlan(): PlannedMeal[] {
    const candidates: Record<string, PlannedMeal> = {
      burger: {
        name: 'Burger',
        servings: 1,
        times: 2,
        ingredients: 'Meat, lettuce, tomato, cheese & dough',
      },
      pasta: { name: 'Pasta', servings: 2, times: 2, ingredients: 'Dough, tomato, cheese & meat' },
      pizza: {
        name: 'Pizza',
        servings: 4,
        times: 1,
        ingredients: 'Dough, tomato, cheese & olives',
      },
      salad: {
        name: 'Salad',
        servings: 3,
        times: 1,
        ingredients: 'Lettuce, tomato, cucumber, cheese & olives',
      },
      sandwich: { name: 'Sandwich', servings: 1, times: 1, ingredients: 'Dough & cucumber' },
      pie: { name: 'Pie', servings: 1, times: 1, ingredients: 'Dough & meat' },
    };
    return this.selectedRecipes()
      .map((recipe) => candidates[recipe.id] ?? this.fallbackMeal(recipe))
      .slice(0, 4);
  }

  private fallbackMeal(recipe: Recipe): PlannedMeal {
    return {
      name: recipe.name,
      servings: recipe.servings,
      times: 1,
      ingredients: recipe.ingredients.map((ingredient) => ingredient.name).join(', '),
    };
  }
}

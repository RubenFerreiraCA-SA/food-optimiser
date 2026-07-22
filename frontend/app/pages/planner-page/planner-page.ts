import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmIngredientsView } from './confirm-ingredients-view/confirm-ingredients-view';
import { ConfirmMenuView } from './confirm-menu-view/confirm-menu-view';
import { OptimisedPlanView } from './optimised-plan-view/optimised-plan-view';
import { PageHero, PageHeroConfig } from '../../shared/components/page-hero/page-hero';
import { MenuService } from '../../services/page-helpers/menu/menu.service';
import {
  OptimisedPlanMeal,
  IngredientPlanUsage,
  PlannerService,
} from '../../services/page-helpers/planner/planner.service';
import { PantryIngredient, PantryService } from '../../services/page-helpers/pantry/pantry.service';

export interface PlanningIngredient extends PantryIngredient {
  planningQuantity: number;
}

export type PlannedMeal = OptimisedPlanMeal;
export type PlannedIngredientUsage = IngredientPlanUsage;

@Component({
  selector: 'app-planner-page',
  imports: [ConfirmIngredientsView, ConfirmMenuView, OptimisedPlanView, PageHero],
  templateUrl: './planner-page.html',
  styleUrl: './planner-page.scss',
})
export class PlannerPage {
  readonly pantry = inject(PantryService);
  readonly menu = inject(MenuService);
  private readonly planner = inject(PlannerService);
  readonly hero: PageHeroConfig = {
    eyebrow: 'Make the most of what you have',
    title: 'Plan your meals.',
    description: "We'll help you find the menu that makes your ingredients go furthest.",
    titleId: 'planner-title',
    mark: '📋',
    markRotation: 12,
  };

  readonly step = signal(1);
  readonly planningIngredients = signal<PlanningIngredient[]>(this.createPlanningIngredients());
  readonly selectedRecipeIds = signal<string[]>(this.menu.selectedRecipeIds());
  readonly plan = computed(() => this.planner.plan());
  readonly planMeals = computed(() => this.plan()?.meals ?? []);
  readonly totalServings = computed(() => this.plan()?.totalMeals ?? 0);
  readonly totalDishes = computed(() => this.plan()?.totalDishes ?? 0);
  readonly ingredientUsage = computed(() => this.plan()?.ingredients ?? []);
  readonly selectedRecipes = computed(() =>
    this.menu.recipes().filter((recipe) => this.selectedRecipeIds().includes(recipe.id)),
  );

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

  async createPlan(): Promise<void> {
    await this.planner.createPlan(
      this.planningIngredients().map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.planningQuantity,
      })),
      this.selectedRecipes(),
    );
    if (this.planner.error()) return;
    this.step.set(3);
  }

  goTo(step: number): void {
    if (step < this.step()) this.step.set(step);
  }

  startAgain(): void {
    this.planningIngredients.set(this.createPlanningIngredients());
    this.selectedRecipeIds.set(this.menu.selectedRecipeIds());
    this.planner.clear();
    this.step.set(1);
  }

  private createPlanningIngredients(): PlanningIngredient[] {
    return this.pantry
      .ingredients()
      .map((ingredient) => ({ ...ingredient, planningQuantity: ingredient.quantity }));
  }
}

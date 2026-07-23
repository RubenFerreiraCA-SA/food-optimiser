import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PlannerPage } from './planner-page';
import { ConfirmIngredientsView } from './confirm-ingredients-view/confirm-ingredients-view';
import { ConfirmMenuView } from './confirm-menu-view/confirm-menu-view';
import { OptimisedPlanView } from './optimised-plan-view/optimised-plan-view';
import { PageHero, PageHeroConfig } from '../../shared/components/page-hero/page-hero';
import { MenuService } from '../../services/page-helpers/menu/menu.service';
import { PantryService, PantryIngredient } from '../../services/page-helpers/pantry/pantry.service';
import {
  IngredientPlanUsage,
  OptimisedPlan,
  OptimisedPlanMeal,
  PlannerService,
} from '../../services/page-helpers/planner/planner.service';
import type { Recipe } from '../../services/data/shared-types';

@Component({
  selector: 'app-page-hero',
  standalone: true,
  template: '<header class="page-hero">{{ config.title }}</header>',
})
class FakePageHero {
  @Input() config!: PageHeroConfig;
}

@Component({
  selector: 'app-confirm-ingredients-view',
  standalone: true,
  template: `
    <section class="confirm-ingredients-view">
      <p class="ingredient-count">{{ ingredients.length }}</p>
      <button
        class="ingredient-change"
        type="button"
        (click)="quantityChange.emit({ id: ingredients[0].id, quantity: 7.9 })"
      >
        Change ingredient
      </button>
      <button class="ingredient-confirm" type="button" (click)="confirmed.emit()">Continue</button>
    </section>
  `,
})
class FakeConfirmIngredientsView {
  @Input({ required: true }) ingredients!: Array<PantryIngredient & { planningQuantity: number }>;
  @Output() readonly quantityChange = new EventEmitter<{ id: string; quantity: number }>();
  @Output() readonly confirmed = new EventEmitter<void>();
}

@Component({
  selector: 'app-confirm-menu-view',
  standalone: true,
  template: `
    <section class="confirm-menu-view">
      <p class="recipe-count">{{ recipes.length }}</p>
      <button class="menu-toggle" type="button" (click)="selectionChange.emit(recipes[0].id)">Toggle</button>
      <button class="menu-back" type="button" (click)="back.emit()">Back</button>
      <button class="menu-confirm" type="button" (click)="confirmed.emit()">Plan</button>
    </section>
  `,
})
class FakeConfirmMenuView {
  @Input({ required: true }) recipes!: Recipe[];
  @Input() selectedRecipeIds: string[] = [];
  @Output() readonly selectionChange = new EventEmitter<string>();
  @Output() readonly back = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<void>();
}

@Component({
  selector: 'app-optimised-plan-view',
  standalone: true,
  template: `
    <section class="optimised-plan-view">
      <p class="meal-count">{{ meals.length }}</p>
      <p class="summary">{{ totalServings }} / {{ totalDishes }} / {{ recipeCount }}</p>
      <button class="plan-adjust" type="button" (click)="adjustMenu.emit()">Adjust menu</button>
      <button class="plan-start" type="button" (click)="startNew.emit()">Start again</button>
    </section>
  `,
})
class FakeOptimisedPlanView {
  @Input() meals: OptimisedPlanMeal[] = [];
  @Input() totalServings = 0;
  @Input() totalDishes = 0;
  @Input() ingredientUsage: IngredientPlanUsage[] = [];
  @Input() recipeCount = 0;
  @Output() readonly adjustMenu = new EventEmitter<void>();
  @Output() readonly startNew = new EventEmitter<void>();
}

describe('PlannerPage', () => {
  const pantryState = signal<PantryIngredient[]>([
    { id: 'tomato', name: 'Tomato', quantity: 4, image: '' },
    { id: 'onion', name: 'Onion', quantity: 2, image: '' },
  ]);
  const menuRecipesState = signal<Recipe[]>([
    {
      id: 'soup',
      name: 'Soup',
      servings: 2,
      image: '',
      ingredients: { tomato: 2, onion: 1 },
      origin: 'shared',
    },
    {
      id: 'salad',
      name: 'Salad',
      servings: 1,
      image: '',
      ingredients: { onion: 1 },
      origin: 'custom',
    },
  ]);
  const selectedRecipeIdsState = signal<string[]>(['soup']);
  const planState = signal<OptimisedPlan | null>(null);
  const loadingState = signal(false);
  const errorState = signal('');

  const pantry = {
    ingredients: () => pantryState(),
  };

  const menu = {
    recipes: () => menuRecipesState(),
    selectedRecipeIds: () => selectedRecipeIdsState(),
  };

  const planner = {
    plan: planState,
    loading: loadingState,
    error: errorState,
    createPlan: vi.fn(async (_ingredients: Array<{ id: string; name: string; quantity: number }>, _recipes: Recipe[]) =>
      undefined,
    ),
    clear: vi.fn(() => {
      planState.set(null);
      loadingState.set(false);
      errorState.set('');
    }),
  };

  let fixture: ComponentFixture<PlannerPage>;
  let component: PlannerPage;

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [PlannerPage],
      providers: [
        { provide: PantryService, useValue: pantry },
        { provide: MenuService, useValue: menu },
        { provide: PlannerService, useValue: planner },
      ],
    })
      .overrideComponent(PlannerPage, {
        remove: {
          imports: [ConfirmIngredientsView, ConfirmMenuView, OptimisedPlanView, PageHero],
        },
        add: {
          imports: [FakeConfirmIngredientsView, FakeConfirmMenuView, FakeOptimisedPlanView, FakePageHero],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PlannerPage);
    component = fixture.componentInstance;
    await render();
  };

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    pantryState.set([
      { id: 'tomato', name: 'Tomato', quantity: 4, image: '' },
      { id: 'onion', name: 'Onion', quantity: 2, image: '' },
    ]);
    menuRecipesState.set([
      {
        id: 'soup',
        name: 'Soup',
        servings: 2,
        image: '',
        ingredients: { tomato: 2, onion: 1 },
        origin: 'shared',
      },
      {
        id: 'salad',
        name: 'Salad',
        servings: 1,
        image: '',
        ingredients: { onion: 1 },
        origin: 'custom',
      },
    ]);
    selectedRecipeIdsState.set(['soup']);
    planState.set(null);
    loadingState.set(false);
    errorState.set('');
    planner.createPlan.mockClear();
    planner.clear.mockClear();
  });

  describe('given the ingredient step', () => {
    it('should seed the planning ingredients and adjust step one interactions', async () => {
      // Assemble
      await createComponent();

      // Assert
      expect(component.step()).toBe(1);
      expect(component.planningIngredients()).toEqual([
        { id: 'tomato', name: 'Tomato', quantity: 4, image: '', planningQuantity: 4 },
        { id: 'onion', name: 'Onion', quantity: 2, image: '', planningQuantity: 2 },
      ]);
      expect(component.selectedRecipes().map((recipe) => recipe.id)).toEqual(['soup']);
      expect(fixture.nativeElement.textContent).toContain('Ingredients');
      expect(fixture.nativeElement.querySelector('app-confirm-ingredients-view')).toBeTruthy();

      // Act
      component.updateIngredient('tomato', 7.9);
      component.updateIngredient('onion', Number.NaN);
      component.toggleRecipe('soup');
      component.toggleRecipe('salad');
      component.goTo(1);
      component.continueToMenu();
      component.goTo(1);

      // Assert
      expect(component.planningIngredients().map((ingredient) => ingredient.planningQuantity)).toEqual([7, 0]);
      expect(component.selectedRecipeIds()).toEqual(['salad']);
      expect(component.selectedRecipes().map((recipe) => recipe.id)).toEqual(['salad']);
      expect(component.step()).toBe(1);
    });

    it('should emit ingredient changes and continue from the template', async () => {
      // Assemble
      await createComponent();

      // Act
      (fixture.nativeElement.querySelector('.ingredient-change') as HTMLButtonElement).click();
      await render();
      (fixture.nativeElement.querySelector('.ingredient-confirm') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(component.planningIngredients()[0].planningQuantity).toBe(7);
      expect(component.step()).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('Menu');
      expect(fixture.nativeElement.querySelector('app-confirm-menu-view')).toBeTruthy();
    });
  });

  describe('given the menu step', () => {
    it('should allow moving back and create the plan from selected recipes', async () => {
      // Assemble
      selectedRecipeIdsState.set(['salad']);
      await createComponent();
      component.continueToMenu();
      await render();

      // Act
      (fixture.nativeElement.querySelector('.menu-back') as HTMLButtonElement).click();
      await render();
      component.continueToMenu();
      await render();
      planner.createPlan.mockImplementationOnce(async () => {
        planState.set({
          meals: [
            {
              recipeId: 'salad',
              name: 'Salad',
              dishes: 1,
              meals: 1,
              ingredients: 'Onion: 1',
            },
          ],
          totalDishes: 1,
          totalMeals: 1,
          ingredients: [
            { id: 'tomato', name: 'Tomato', before: 4, used: 0, left: 4 },
            { id: 'onion', name: 'Onion', before: 2, used: 1, left: 1 },
          ],
        });
      });
      (fixture.nativeElement.querySelector('.menu-confirm') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(component.selectedRecipeIds()).toEqual(['salad']);
      expect(component.step()).toBe(3);
      expect(planner.createPlan).toHaveBeenCalledWith(
        [
          { id: 'tomato', name: 'Tomato', quantity: 4 },
          { id: 'onion', name: 'Onion', quantity: 2 },
        ],
        [menuRecipesState()[1]],
      );
      expect(fixture.nativeElement.textContent).toContain('Your plan');
      expect(fixture.nativeElement.querySelector('app-optimised-plan-view')).toBeTruthy();
      (fixture.nativeElement.querySelector('.plan-adjust') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(component.step()).toBe(2);

      // Act
      component.step.set(3);
      await render();
      (fixture.nativeElement.querySelector('.plan-start') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(planner.clear).toHaveBeenCalledTimes(1);
      expect(component.step()).toBe(1);
      expect(component.planningIngredients()).toEqual([
        { id: 'tomato', name: 'Tomato', quantity: 4, image: '', planningQuantity: 4 },
        { id: 'onion', name: 'Onion', quantity: 2, image: '', planningQuantity: 2 },
      ]);
      expect(component.selectedRecipeIds()).toEqual(['salad']);
    });
  });

  describe('given a loading or failed plan', () => {
    it('should render loading and error states and allow retrying the plan', async () => {
      // Assemble
      await createComponent();
      loadingState.set(true);
      await render();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Generating your plan...');

      // Act
      loadingState.set(false);
      errorState.set('Unable to create a plan right now. Please try again.');
      await render();
      (fixture.nativeElement.querySelector('.planner-status__action') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(fixture.nativeElement.textContent).toContain(
        'Unable to create a plan right now. Please try again.',
      );
      expect(planner.createPlan).toHaveBeenCalledTimes(1);
    });
  });
});

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PlannerPage } from './planner-page';
import { IngredientCatalogService } from '../../services/data/ingredient-catalog.service';
import { MenuService } from '../../services/page-helpers/menu/menu.service';
import { PantryService, PantryIngredient } from '../../services/page-helpers/pantry/pantry.service';
import { PlannerService, OptimisedPlan } from '../../services/page-helpers/planner/planner.service';
import type { Recipe } from '../../services/data/shared-types';

describe('PlannerPage render', () => {
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
  const ingredientNames = new Map([
    ['tomato', 'Tomato'],
    ['onion', 'Onion'],
  ]);

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
    createPlan: vi.fn(async () => {
      errorState.set('');
      planState.set({
        meals: [
          {
            recipeId: 'soup',
            name: 'Soup',
            dishes: 2,
            meals: 4,
            ingredients: 'Tomato: 4, Onion: 2',
          },
        ],
        totalDishes: 2,
        totalMeals: 4,
        ingredients: [
          { id: 'tomato', name: 'Tomato', before: 4, used: 4, left: 0 },
          { id: 'onion', name: 'Onion', before: 2, used: 2, left: 0 },
        ],
      });
    }),
    clear: vi.fn(() => {
      planState.set(null);
      loadingState.set(false);
      errorState.set('');
    }),
  };

  const catalog = {
    nameFor: vi.fn((id: string) => ingredientNames.get(id) ?? id),
    find: vi.fn((id: string) => (ingredientNames.has(id) ? { id, name: ingredientNames.get(id)!, image: '' } : undefined)),
    imageFor: vi.fn(() => ''),
  };

  let fixture: ComponentFixture<PlannerPage>;
  let component: PlannerPage;

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [PlannerPage, RouterTestingModule],
      providers: [
        { provide: PantryService, useValue: pantry },
        { provide: MenuService, useValue: menu },
        { provide: PlannerService, useValue: planner },
        { provide: IngredientCatalogService, useValue: catalog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlannerPage);
    component = fixture.componentInstance;
  };

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const clickAndRender = async (selector: string): Promise<void> => {
    (fixture.nativeElement.querySelector(selector) as HTMLButtonElement).click();
    await render();
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
    catalog.nameFor.mockClear();
    catalog.find.mockClear();
    catalog.imageFor.mockClear();
  });

  describe('given the normal planning flow', () => {
    it('should render each step and wire the actions', async () => {
      // Assemble
      await createComponent();

      // Act
      await render();
      expect(fixture.nativeElement.textContent).toContain('Confirm your ingredients');
      expect(fixture.nativeElement.textContent).toContain('Edit pantry instead');

      // Act
      await clickAndRender('app-confirm-ingredients-view .button.primary');
      expect(fixture.nativeElement.textContent).toContain('Confirm your menu');
      expect(fixture.nativeElement.textContent).toContain('Create meal plan');

      // Act
      await clickAndRender('app-confirm-menu-view .button.primary');
      expect(fixture.nativeElement.textContent).toContain("Here's your best meal plan.");
      expect(fixture.nativeElement.textContent).toContain('Adjust menu');
      expect(fixture.nativeElement.textContent).toContain('Start a new plan');

      // Act
      await clickAndRender('app-optimised-plan-view .button.secondary');
      expect(fixture.nativeElement.textContent).toContain('Confirm your menu');

      // Act
      component.step.set(3);
      await render();
      expect(fixture.nativeElement.textContent).toContain("Here's your best meal plan.");

      // Act
      await clickAndRender('app-optimised-plan-view .button.primary');
      expect(fixture.nativeElement.textContent).toContain('Confirm your ingredients');

      // Assert
      expect(planner.createPlan).toHaveBeenCalledTimes(1);
      expect(planner.clear).toHaveBeenCalledTimes(1);
      expect(component.step()).toBe(1);
      expect(component.planningIngredients()).toEqual([
        { id: 'tomato', name: 'Tomato', quantity: 4, image: '', planningQuantity: 4 },
        { id: 'onion', name: 'Onion', quantity: 2, image: '', planningQuantity: 2 },
      ]);
    });
  });

  describe('given loading and error states', () => {
    it('should render the status banners and retry the plan', async () => {
      // Assemble
      await createComponent();
      loadingState.set(true);

      // Act
      await render();
      expect(fixture.nativeElement.textContent).toContain('Generating your plan...');

      // Act
      loadingState.set(false);
      errorState.set('Unable to create a plan right now. Please try again.');
      await render();
      expect(fixture.nativeElement.textContent).toContain('Unable to create a plan right now. Please try again.');

      // Act
      await clickAndRender('.planner-status__action');
      expect(fixture.nativeElement.textContent).toContain("Here's your best meal plan.");

      // Assert
      expect(planner.createPlan).toHaveBeenCalledTimes(1);
      expect(component.step()).toBe(3);
    });
  });
});

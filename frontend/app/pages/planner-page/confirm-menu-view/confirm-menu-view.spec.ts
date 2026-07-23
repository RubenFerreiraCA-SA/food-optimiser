import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfirmMenuView } from './confirm-menu-view';
import { IngredientCatalogService } from '../../../services/domain/ingredients/ingredient-catalog.service';
import type { Recipe, SharedIngredient } from '../../../services/domain/models';

describe('ConfirmMenuView', () => {
  let fixture: ComponentFixture<ConfirmMenuView>;
  let component: ConfirmMenuView;
  const selectionChange = vi.fn();
  const back = vi.fn();
  const confirmed = vi.fn();

  const catalogState: SharedIngredient[] = [
    { id: 'tomato', name: 'Tomato', image: '' },
    { id: 'onion', name: 'Onion', image: '' },
    { id: 'garlic', name: 'Garlic', image: '' },
  ];

  const catalog = {
    nameFor: vi.fn((id: string) => catalogState.find((ingredient) => ingredient.id === id)?.name ?? id),
  };

  const recipes: Recipe[] = [
    {
      id: 'soup',
      name: 'Soup',
      servings: 2,
      image: '',
      ingredients: { tomato: 2, onion: 1 },
    },
    {
      id: 'salad',
      name: 'Salad',
      servings: 1,
      image: '',
      ingredients: { garlic: 1 },
    },
  ];

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [ConfirmMenuView, RouterTestingModule],
      providers: [{ provide: IngredientCatalogService, useValue: catalog }],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmMenuView);
    component = fixture.componentInstance;
    component.selectionChange.subscribe(selectionChange);
    component.back.subscribe(back);
    component.confirmed.subscribe(confirmed);
  };

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    selectionChange.mockClear();
    back.mockClear();
    confirmed.mockClear();
    catalog.nameFor.mockClear();
  });

  describe('given no recipes', () => {
    it('should render the empty state and disable plan creation', async () => {
      await createComponent();

      // Assemble
      component.recipes = [];
      component.selectedRecipeIds = [];

      // Act
      await render();
      (fixture.nativeElement.querySelector('.button.secondary') as HTMLButtonElement).click();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Your menu is empty.');
      expect(fixture.nativeElement.textContent).toContain('Add recipes before building a plan.');
      expect(fixture.nativeElement.querySelector('.empty-state a.button.primary')).toBeTruthy();
      expect(fixture.nativeElement.querySelectorAll('app-recipe-card').length).toBe(0);
      expect((fixture.nativeElement.querySelector('.footer-actions .button.primary') as HTMLButtonElement).disabled).toBe(true);
      expect(back).toHaveBeenCalledTimes(1);
      expect(confirmed).not.toHaveBeenCalled();
    });
  });

  describe('given selected recipes', () => {
    it('should render cards, expose selection state, and emit recipe toggles', async () => {
      await createComponent();

      // Assemble
      component.recipes = recipes;
      component.selectedRecipeIds = ['soup'];

      // Act
      await render();
      const checkbox = fixture.nativeElement.querySelector(
        'app-recipe-card input[type="checkbox"]',
      ) as HTMLInputElement;
      checkbox.click();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('1 recipes selected');
      expect(fixture.nativeElement.textContent).toContain('Confirm your menu');
      expect(fixture.nativeElement.textContent).toContain('Uncheck anything you don\'t want included in this plan.');
      expect(fixture.nativeElement.querySelectorAll('app-recipe-card').length).toBe(2);
      expect(fixture.nativeElement.querySelector('.recipe-card--select.selected')).toBeTruthy();
      expect(selectionChange).toHaveBeenCalledWith('soup');
    });
  });

  describe('given a confirmation action', () => {
    it('should enable the create button and emit confirmation', async () => {
      await createComponent();

      // Assemble
      component.recipes = recipes;
      component.selectedRecipeIds = ['soup', 'salad'];

      // Act
      await render();
      (fixture.nativeElement.querySelector('.button.primary') as HTMLButtonElement).click();

      // Assert
      expect((fixture.nativeElement.querySelector('.button.primary') as HTMLButtonElement).disabled).toBe(false);
      expect(confirmed).toHaveBeenCalledTimes(1);
    });
  });

  describe('given the recipe card config', () => {
    it('should build a select config and handle recipe card actions', async () => {
      await createComponent();

      // Assemble
      component.selectedRecipeIds = ['salad'];

      // Act
      const config = component.recipeCard(recipes[1]);
      component.handleRecipeCard({ action: 'toggle', recipe: recipes[1] });

      // Assert
      expect(component.isSelected('salad')).toBe(true);
      expect(config).toEqual({ recipe: recipes[1], mode: 'select', selected: true });
      expect(selectionChange).toHaveBeenCalledWith('salad');
    });
  });
});

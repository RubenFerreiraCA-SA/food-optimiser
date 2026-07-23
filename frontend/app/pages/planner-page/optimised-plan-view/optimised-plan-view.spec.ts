import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OptimisedPlanView } from './optimised-plan-view';

describe('OptimisedPlanView', () => {
  let fixture: ComponentFixture<OptimisedPlanView>;
  let component: OptimisedPlanView;
  const adjustMenu = vi.fn();
  const startNew = vi.fn();

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [OptimisedPlanView],
    }).compileComponents();

    fixture = TestBed.createComponent(OptimisedPlanView);
    component = fixture.componentInstance;
    component.adjustMenu.subscribe(adjustMenu);
    component.startNew.subscribe(startNew);
  };

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    adjustMenu.mockClear();
    startNew.mockClear();
  });

  describe('given no meals', () => {
    it('should render the empty state, summary, usage table, and action buttons', async () => {
      await createComponent();

      // Assemble
      component.totalServings = 12;
      component.totalDishes = 4;
      component.recipeCount = 9;
      component.meals = [];
      component.ingredientUsage = [
        { id: 'tomato', name: 'Tomato', before: 6, used: 4, left: 2 },
      ];

      // Act
      await render();
      (fixture.nativeElement.querySelector('.button.secondary') as HTMLButtonElement).click();
      (fixture.nativeElement.querySelector('.button.primary') as HTMLButtonElement).click();

      // Assert
      expect(fixture.nativeElement.textContent).toContain("Here's your best meal plan.");
      expect(fixture.nativeElement.textContent).toContain('12');
      expect(fixture.nativeElement.textContent).toContain('4');
      expect(fixture.nativeElement.textContent).toContain('9');
      expect(fixture.nativeElement.textContent).toContain('No recipes selected yet.');
      expect(fixture.nativeElement.textContent).toContain('Choose at least one recipe to generate a plan.');
      expect(fixture.nativeElement.textContent).toContain('Tomato');
      expect(fixture.nativeElement.textContent).toContain('6');
      expect(fixture.nativeElement.textContent).toContain('4');
      expect(fixture.nativeElement.textContent).toContain('2');
      expect(adjustMenu).toHaveBeenCalledTimes(1);
      expect(startNew).toHaveBeenCalledTimes(1);
    });
  });

  describe('given meals', () => {
    it('should render the meal list and usage rows', async () => {
      await createComponent();

      // Assemble
      component.totalServings = 16;
      component.totalDishes = 5;
      component.recipeCount = 8;
      component.meals = [
        { recipeId: 'soup', name: 'Soup', dishes: 2, ingredients: 'Tomato, Onion', meals: 3 },
        { recipeId: 'salad', name: 'Salad', dishes: 1, ingredients: 'Lettuce, Tomato', meals: 2 },
      ];
      component.ingredientUsage = [
        { id: 'tomato', name: 'Tomato', before: 8, used: 5, left: 3 },
        { id: 'onion', name: 'Onion', before: 4, used: 2, left: 2 },
      ];

      // Act
      await render();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Soup');
      expect(fixture.nativeElement.textContent).toContain('2×');
      expect(fixture.nativeElement.textContent).toContain('Tomato, Onion');
      expect(fixture.nativeElement.textContent).toContain('3 meals');
      expect(fixture.nativeElement.textContent).toContain('Salad');
      expect(fixture.nativeElement.textContent).toContain('1×');
      expect(fixture.nativeElement.textContent).toContain('Lettuce, Tomato');
      expect(fixture.nativeElement.textContent).toContain('2 meals');
      expect(fixture.nativeElement.textContent).toContain('Ingredient use');
      expect(fixture.nativeElement.textContent).toContain('Before');
      expect(fixture.nativeElement.textContent).toContain('Used');
      expect(fixture.nativeElement.textContent).toContain('Left after');
      expect(fixture.nativeElement.textContent).toContain('Tomato');
      expect(fixture.nativeElement.textContent).toContain('Onion');
    });
  });
});

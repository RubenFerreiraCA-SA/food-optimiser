import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfirmIngredientsView } from './confirm-ingredients-view';
import {
  IngredientTable,
  IngredientTableConfig,
  IngredientTableEvent,
  IngredientTableRow,
} from '../../../shared/components/ingredient-table/ingredient-table';
import type { PlanningIngredient } from '../planner-page';

@Component({
  selector: 'app-ingredient-table',
  standalone: true,
  template: `
    <div class="ingredient-table">
      <p class="caption">{{ config.caption }}</p>
      <p class="quantity-header">{{ config.quantityHeader }}</p>
      <button class="quantity-change" type="button" (click)="quantityChange.emit({ row: config.rows[0], quantity: 9 })">
        Change quantity
      </button>
    </div>
  `,
})
class FakeIngredientTable {
  @Input({ required: true }) config!: IngredientTableConfig;
  @Output() readonly action = new EventEmitter<IngredientTableEvent>();
  @Output() readonly quantityChange = new EventEmitter<{ row: IngredientTableRow; quantity: number }>();
}

describe('ConfirmIngredientsView', () => {
  let fixture: ComponentFixture<ConfirmIngredientsView>;
  let component: ConfirmIngredientsView;
  const quantityChange = vi.fn();
  const confirmed = vi.fn();

  const ingredients: PlanningIngredient[] = [
    { id: 'tomato', name: 'Tomato', quantity: 4, image: '', planningQuantity: 3 },
    { id: 'onion', name: 'Onion', quantity: 2, image: '', planningQuantity: 1 },
  ];

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [ConfirmIngredientsView, RouterTestingModule],
    })
      .overrideComponent(ConfirmIngredientsView, {
        remove: { imports: [IngredientTable] },
        add: { imports: [FakeIngredientTable] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConfirmIngredientsView);
    component = fixture.componentInstance;
    component.quantityChange.subscribe(quantityChange);
    component.confirmed.subscribe(confirmed);
  };

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    quantityChange.mockClear();
    confirmed.mockClear();
  });

  describe('given planning ingredients', () => {
    it('should build the ingredient table config', async () => {
      // Assemble
      await createComponent();
      component.ingredients = ingredients;

      // Act
      const config = component.ingredientTable;

      // Assert
      expect(config).toEqual({
        caption: 'Ingredients available for this meal plan',
        quantityHeader: 'Quantity available',
        rows: [
          { id: 'tomato', name: 'Tomato', quantity: 3 },
          { id: 'onion', name: 'Onion', quantity: 1 },
        ],
        quantityMode: 'always-edit',
      });
    });

    it('should render the ingredient table and emit events', async () => {
      // Assemble
      await createComponent();
      component.ingredients = ingredients;

      // Act
      await render();
      (fixture.nativeElement.querySelector('.quantity-change') as HTMLButtonElement).click();
      (fixture.nativeElement.querySelector('.button.primary') as HTMLButtonElement).click();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('2 ingredients to use');
      expect(fixture.nativeElement.textContent).toContain('Confirm your ingredients');
      expect(fixture.nativeElement.textContent).toContain('Adjust quantities for this plan. Your pantry stays unchanged.');
      expect(fixture.nativeElement.textContent).toContain('Edit pantry instead');
      expect(fixture.nativeElement.querySelector('.caption').textContent).toContain(
        'Ingredients available for this meal plan',
      );
      expect(fixture.nativeElement.querySelector('.quantity-header').textContent).toContain(
        'Quantity available',
      );
      expect(quantityChange).toHaveBeenCalledWith({ id: 'tomato', quantity: 9 });
      expect(confirmed).toHaveBeenCalledTimes(1);
    });
  });
});

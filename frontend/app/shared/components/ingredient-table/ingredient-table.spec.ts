import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IngredientTable, IngredientTableConfig, IngredientTableEvent } from './ingredient-table';

describe('IngredientTable', () => {
  const rows = [
    { id: 'tomato', name: 'Tomato', quantity: 4 },
    { id: 'onion', name: 'Onion', quantity: 2 },
  ];

  let fixture: ComponentFixture<IngredientTable>;
  let component: IngredientTable;
  const action = vi.fn();
  const quantityChange = vi.fn();

  const createComponent = async (config: IngredientTableConfig): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [IngredientTable],
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientTable);
    component = fixture.componentInstance;
    component.config = config;
    component.action.subscribe(action);
    component.quantityChange.subscribe(quantityChange);
  };

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setQuantity = async (selector: string, value: string): Promise<void> => {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement | null;
    if (!input) throw new Error(`Missing input: ${selector}`);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await render();
  };

  const click = async (selector: string): Promise<void> => {
    const button = fixture.nativeElement.querySelector(selector) as HTMLButtonElement | null;
    if (!button) throw new Error(`Missing button: ${selector}`);
    button.click();
    await render();
  };

  beforeEach(() => {
    action.mockClear();
    quantityChange.mockClear();
  });

  describe('given a readonly table without actions', () => {
    it('should render quantities and omit the actions column', async () => {
      // Assemble
      await createComponent({
        caption: 'Pantry ingredients',
        quantityHeader: 'Quantity available',
        rows,
        quantityMode: 'readonly',
        showQuantityLabel: true,
      });

      // Act
      await render();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Pantry ingredients');
      expect(fixture.nativeElement.textContent).toContain('Tomato');
      expect(fixture.nativeElement.textContent).toContain('4 available');
      expect(fixture.nativeElement.textContent).toContain('Onion');
      expect(fixture.nativeElement.querySelectorAll('thead th').length).toBe(2);
      expect(fixture.nativeElement.querySelectorAll('.row-actions').length).toBe(0);
      expect(fixture.nativeElement.querySelectorAll('input[type="number"]').length).toBe(0);
    });
  });

  describe('given an always-edit table with row actions', () => {
    it('should render quantity editors and emit quantity changes and actions', async () => {
      // Assemble
      await createComponent({
        caption: 'Editable pantry',
        quantityHeader: 'Quantity available',
        rows,
        quantityMode: 'always-edit',
        actions: [
          { id: 'save', label: 'Save' },
          { id: 'remove', label: 'Remove', variant: 'remove' },
        ],
      });

      // Act
      await render();
      await setQuantity('#quantity-tomato', '7');
      await click('.row-actions .table-action');
      await click('.row-actions .table-action.remove');

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Editable pantry');
      expect(fixture.nativeElement.querySelectorAll('thead th').length).toBe(3);
      expect(fixture.nativeElement.querySelectorAll('.quantity-editor input').length).toBe(2);
      expect(quantityChange).toHaveBeenCalledWith({ row: rows[0], quantity: 7 });
      expect(action).toHaveBeenCalledWith({ action: 'save', row: rows[0] });
      expect(action).toHaveBeenCalledWith({ action: 'remove', row: rows[0] });
    });
  });

  describe('given an editing row with an error message', () => {
    it('should render the edit controls and emit save and cancel actions', async () => {
      // Assemble
      await createComponent({
        caption: 'Editing pantry',
        quantityHeader: 'Quantity available',
        rows,
        quantityMode: 'editing',
        editingId: 'onion',
        editingQuantity: 5,
        editError: 'Enter a whole number of zero or more.',
        actions: [
          { id: 'edit', label: 'Edit' },
          { id: 'remove', label: 'Remove', variant: 'remove' },
        ],
      });

      // Act
      await render();
      await setQuantity('#quantity-onion', '9');
      await click('.quantity-editor .table-action.save');
      await click('.quantity-editor .table-action:not(.save)');

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Editing pantry');
      expect(fixture.nativeElement.textContent).toContain('Enter a whole number of zero or more.');
      expect(fixture.nativeElement.querySelectorAll('.quantity-editor input').length).toBe(1);
      expect(fixture.nativeElement.querySelectorAll('.row-actions').length).toBe(2);
      expect(quantityChange).toHaveBeenCalledWith({ row: rows[1], quantity: 9 });
      expect(action).toHaveBeenCalledWith({ action: 'save', row: rows[1] });
      expect(action).toHaveBeenCalledWith({ action: 'cancel', row: rows[1] });
    });
  });
});

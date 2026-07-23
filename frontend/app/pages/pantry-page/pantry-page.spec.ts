import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PantryPage } from './pantry-page';
import { IngredientCatalogService } from '../../services/data/ingredient-catalog.service';
import { MenuService } from '../../services/page-helpers/menu/menu.service';
import { PantryService, PantryIngredient } from '../../services/page-helpers/pantry/pantry.service';
import type { Recipe, SharedIngredient } from '../../services/data/shared-types';

describe('PantryPage', () => {
  const pantryState = signal<PantryIngredient[]>([]);
  const menuRecipesState = signal<Recipe[]>([]);
  const catalogState = signal<SharedIngredient[]>([]);

  const pantry = {
    ingredients: () => pantryState(),
    add: vi.fn(async (ingredientId: string, quantity: number) => {
      if (quantity < 1) return false;
      const ingredient = catalogState().find((item) => item.id === ingredientId);
      if (!ingredient) return false;
      pantryState.update((items) =>
        [...items, { ...ingredient, quantity }].sort((left, right) =>
          left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
        ),
      );
      return true;
    }),
    remove: vi.fn(async (id: string) => {
      pantryState.update((items) => items.filter((ingredient) => ingredient.id !== id));
    }),
    setQuantity: vi.fn(async (id: string, quantity: number) => {
      if (!Number.isInteger(quantity) || quantity < 0) return false;
      const ingredient = pantryState().find((item) => item.id === id);
      if (!ingredient) return false;
      pantryState.update((items) =>
        items.map((item) => (item.id === id ? { ...item, quantity } : item)),
      );
      return true;
    }),
    reset: vi.fn(async () => {
      pantryState.set([
        { id: 'tomato', name: 'Tomato', quantity: 2 },
        { id: 'onion', name: 'Onion', quantity: 1 },
      ]);
    }),
  };

  const menu = {
    recipes: () => menuRecipesState(),
  };

  const catalog = {
    find: vi.fn((id: string) => catalogState().find((ingredient) => ingredient.id === id)),
    findByName: vi.fn((name: string) =>
      catalogState().find((ingredient) => ingredient.name.toLowerCase() === name.trim().toLowerCase()),
    ),
    search: vi.fn((query: string) => {
      const needle = query.trim().toLowerCase();
      if (needle.length < 3) return [];
      return catalogState()
        .filter((ingredient) => ingredient.name.toLowerCase().includes(needle))
        .slice(0, 8);
    }),
    add: vi.fn(async (name: string) => {
      const ingredient = { id: name.toLowerCase(), name, image: '' };
      catalogState.update((items) => [...items, ingredient]);
      return ingredient;
    }),
  };

  let fixture: ComponentFixture<PantryPage>;
  let component: PantryPage;

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [PantryPage],
      providers: [
        { provide: PantryService, useValue: pantry },
        { provide: MenuService, useValue: menu },
        { provide: IngredientCatalogService, useValue: catalog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PantryPage);
    component = fixture.componentInstance;
    await render();
  };

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setInputValue = async (selector: string, value: string): Promise<void> => {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement | null;
    if (!input) throw new Error(`Missing input: ${selector}`);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await render();
  };

  beforeEach(() => {
    pantryState.set([
      { id: 'tomato', name: 'Tomato', quantity: 2 },
      { id: 'onion', name: 'Onion', quantity: 1 },
    ]);
    menuRecipesState.set([
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
        ingredients: { onion: 1 },
      },
    ]);
    catalogState.set([
      { id: 'tomato', name: 'Tomato', image: '' },
      { id: 'onion', name: 'Onion', image: '' },
      { id: 'parsley', name: 'Parsley', image: '' },
      { id: 'garlic', name: 'Garlic', image: '' },
    ]);
    pantry.add.mockClear();
    pantry.remove.mockClear();
    pantry.setQuantity.mockClear();
    pantry.reset.mockClear();
    catalog.find.mockClear();
    catalog.findByName.mockClear();
    catalog.search.mockClear();
    catalog.add.mockClear();
  });

  describe('pantry state', () => {
    describe('given pantry ingredients', () => {
      it('should sort and filter visible ingredients', async () => {
        await createComponent();

        // Assemble
        component.ingredientSearch.set('to');

        // Act
        const visible = component.visibleIngredients();

        // Assert
        expect(visible.map((ingredient) => ingredient.name)).toEqual(['Tomato']);
      });
    });

    describe('given an ingredient lookup', () => {
      it('should expose matches, exact matches, and creation eligibility', async () => {
        await createComponent();

        // Assemble
        component.ingredientName.set('Tomato');

        // Act
        const matches = component.ingredientMatches();
        const exact = component.exactIngredientMatch();
        const canCreate = component.canCreateIngredient();

        // Assert
        expect(matches.map((ingredient) => ingredient.name)).toEqual(['Tomato']);
        expect(exact).toBeTruthy();
        expect(canCreate).toBe(false);
      });
    });
  });

  describe('adding ingredients', () => {
    describe('given an exact pantry match', () => {
      it('should queue an existing ingredient into pending items', async () => {
        await createComponent();

        // Assemble
        component.ingredientName.set('Tomato');

        // Act
        await component.addIngredient();

        // Assert
        expect(component.pendingIngredients()).toEqual([
          {
            id: 'tomato',
            name: 'Tomato',
            quantity: 1,
            image: '',
            isNew: false,
          },
        ]);
        expect(component.ingredientName()).toBe('');
      });
    });

    describe('given a new ingredient name', () => {
      it('should create and queue a new ingredient', async () => {
        await createComponent();

        // Assemble
        component.ingredientName.set('Coriander');

        // Act
        await component.addNewIngredient();

        // Assert
        expect(catalog.add).toHaveBeenCalledWith('Coriander');
        expect(component.pendingIngredients()).toEqual([
          {
            id: 'coriander',
            name: 'Coriander',
            quantity: 1,
            image: '',
            isNew: true,
          },
        ]);
      });
    });

    describe('given invalid ingredient input', () => {
      it('should surface an add error', async () => {
        await createComponent();

        // Assemble
        component.ingredientName.set('a');

        // Act
        await component.addIngredient();

        // Assert
        expect(component.addError).toBe('Pick a match or choose to add a new ingredient.');
      });
    });

    describe('given duplicate pending ingredients', () => {
      it('should reject duplicates when queuing ingredients', async () => {
        await createComponent();

        // Assemble
        component.queueIngredient({ id: 'tomato', name: 'Tomato', image: '' });

        // Act
        component.queueIngredient({ id: 'tomato', name: 'Tomato', image: '' });

        // Assert
        expect(component.addError).toBe('Tomato is already in the list below.');
        expect(component.pendingIngredients()).toHaveLength(1);
      });
    });

    describe('given a pending ingredient', () => {
      it('should update and remove queued items', async () => {
        await createComponent();

        // Assemble
        component.queueIngredient({ id: 'parsley', name: 'Parsley', image: '' }, true);

        // Act
        component.updatePendingQuantity('parsley', 3);
        component.removePendingIngredient('parsley');

        // Assert
        expect(component.pendingIngredients()).toEqual([]);
      });
    });

    describe('given a pending ingredient save', () => {
      it('should add the ingredient to the pantry when the save succeeds', async () => {
        await createComponent();

        // Assemble
        component.queueIngredient({ id: 'parsley', name: 'Parsley', image: '' }, true);

        // Act
        await component.addPendingIngredient('parsley');

        // Assert
        expect(pantry.add).toHaveBeenCalledWith('parsley', 1);
        expect(component.pendingIngredients()).toEqual([]);
      });
    });

    describe('given a pending ingredient save failure', () => {
      it('should keep the queued item and show an error', async () => {
        await createComponent();

        // Assemble
        pantry.add.mockResolvedValueOnce(false);
        component.queueIngredient({ id: 'parsley', name: 'Parsley', image: '' }, true);

        // Act
        await component.addPendingIngredient('parsley');

        // Assert
        expect(component.addError).toBe('Enter a quantity of at least one.');
        expect(component.pendingIngredients()).toHaveLength(1);
      });
    });
  });

  describe('table actions', () => {
    describe('given an ingredient row', () => {
      it('should start editing, save quantity, and cancel editing', async () => {
        await createComponent();

        // Assemble
        const ingredient = pantryState()[0];

        // Act
        component.handleTableAction({ action: 'edit', row: ingredient });
        component.updateEditingQuantity(4);
        await component.handleTableAction({ action: 'save', row: ingredient });
        component.handleTableAction({ action: 'cancel', row: ingredient });

        // Assert
        expect(pantry.setQuantity).toHaveBeenCalledWith('tomato', 4);
        expect(component.editingIngredientId()).toBeNull();
      });
    });

    describe('given a removable ingredient', () => {
      it('should show the removal dialog and confirm removal', async () => {
        await createComponent();

        // Assemble
        const ingredient = { id: 'garlic', name: 'Garlic', quantity: 1 };
        component.handleTableAction({ action: 'remove', row: ingredient });

        // Act
        await component.handleRemovalDialog('confirm');

        // Assert
        expect(pantry.remove).toHaveBeenCalledWith('garlic');
        expect(component.ingredientToRemove()).toBeNull();
      });
    });

    describe('given a blocked ingredient', () => {
      it('should surface the blocked dialog and clear it', async () => {
        await createComponent();

        // Assemble
        component.requestRemoval(pantryState()[1]);

        // Act
        component.cancelDialogs();

        // Assert
        expect(component.blockedIngredient()).toBeNull();
      });
    });
  });

  describe('dialogs and search', () => {
    describe('given a reset request', () => {
      it('should reset the pantry and close dialogs', async () => {
        await createComponent();

        // Assemble
        component.showResetWarning.set(true);

        // Act
        await component.handleResetDialog('confirm');

        // Assert
        expect(pantry.reset).toHaveBeenCalled();
        expect(component.showResetWarning()).toBe(false);
      });
    });

    describe('given ingredient search input', () => {
      it('should clear the search and input error state', async () => {
        await createComponent();

        // Assemble
        component.addError = 'Problem';
        component.ingredientSearch.set('tom');

        // Act
        component.clearIngredientSearch();
        component.onIngredientInput();

        // Assert
        expect(component.ingredientSearch()).toBe('');
        expect(component.addError).toBe('');
      });
    });
  });

  describe('template rendering', () => {
    describe('given the default pantry view', () => {
      it('should render the summary and open the add form and reset dialog', async () => {
        await createComponent();

        // Assemble
        await render();

        // Act
        (fixture.nativeElement.querySelector('.button.secondary') as HTMLButtonElement).click();
        (fixture.nativeElement.querySelector('.button.primary') as HTMLButtonElement).click();
        await render();
        (fixture.debugElement.query(By.css('app-dialog')) as any).triggerEventHandler('action', 'confirm');
        await render();

        // Assert
        expect(fixture.nativeElement.textContent).toContain('2 ingredients available');
        expect(fixture.nativeElement.textContent).toContain('Available ingredients');
        expect(fixture.nativeElement.querySelector('form.add-form')).toBeTruthy();
        expect(pantry.reset).toHaveBeenCalled();
      });
    });

    describe('given ingredient entry input', () => {
      it('should render suggestions, the create button, and the pending queue', async () => {
        await createComponent();

        // Assemble
        (fixture.nativeElement.querySelector('.button.primary') as HTMLButtonElement).click();
        await render();
        await setInputValue('input[name="ingredient-name"]', 'Chili');

        // Act
        expect(fixture.nativeElement.textContent).toContain('Add "Chili"');
        (fixture.nativeElement.querySelector('.add-new') as HTMLButtonElement).click();
        await render();

        // Assert
        expect(fixture.nativeElement.textContent).toContain('New ingredient');
        expect(fixture.nativeElement.querySelector('.pending-section')).toBeTruthy();
      });
    });

    describe('given invalid ingredient input', () => {
      it('should render the add error message', async () => {
        await createComponent();

        // Assemble
        component.isAdding.set(true);
        component.addError = 'Pick a match or choose to add a new ingredient.';

        // Act
        fixture.detectChanges();

        // Assert
        expect(fixture.nativeElement.textContent).toContain('Pick a match or choose to add a new ingredient.');
        expect(fixture.nativeElement.querySelector('.form-error')).toBeTruthy();
      });
    });

    describe('given an existing ingredient suggestion', () => {
      it('should select a suggestion and support adding it to the pantry', async () => {
        await createComponent();

        // Assemble
        (fixture.nativeElement.querySelector('.button.primary') as HTMLButtonElement).click();
        await render();
        await setInputValue('input[name="ingredient-name"]', 'Tom');

        // Act
        expect(fixture.nativeElement.textContent).toContain('Matches');
        (fixture.nativeElement.querySelector('.suggestion-item') as HTMLButtonElement).click();
        await render();

        // Assert
        expect(fixture.nativeElement.textContent).toContain('Queued ingredients');
        expect(fixture.nativeElement.textContent).toContain('Add to pantry');
      });
    });

    describe('given a pending ingredient quantity update', () => {
      it('should render the quantity input and update the queued amount', async () => {
        await createComponent();

        // Assemble
        (fixture.nativeElement.querySelector('.button.primary') as HTMLButtonElement).click();
        await render();
        await setInputValue('input[name="ingredient-name"]', 'Chili');
        (fixture.nativeElement.querySelector('.add-new') as HTMLButtonElement).click();
        await render();

        // Act
        await setInputValue('.pending-item__quantity input', '3');

        // Assert
        expect(component.pendingIngredients()[0].quantity).toBe(3);
        expect(fixture.nativeElement.textContent).toContain('Queued ingredients');
      });
    });

    describe('given a pantry search', () => {
      it('should render and clear the search field', async () => {
        await createComponent();

        // Assemble
        await setInputValue('input[name="ingredient-search"]', 'tom');

        // Act
        (fixture.nativeElement.querySelector('.table-search__clear') as HTMLButtonElement).click();
        await render();

        // Assert
        expect(component.ingredientSearch()).toBe('');
      });
    });

    describe('given a removal dialog', () => {
      it('should render the removal dialog and confirm removal', async () => {
        await createComponent();

        // Assemble
        component.ingredientToRemove.set({ id: 'garlic', name: 'Garlic', quantity: 1 });
        await render();

        // Act
        (fixture.debugElement.query(By.css('app-dialog')) as any).triggerEventHandler('action', 'confirm');
        await render();

        // Assert
        expect(pantry.remove).toHaveBeenCalledWith('garlic');
        expect(component.ingredientToRemove()).toBeNull();
      });
    });

    describe('given a blocked ingredient dialog', () => {
      it('should render the blocked ingredient dialog and cancel it', async () => {
        await createComponent();

        // Assemble
        component.blockedIngredient.set(pantryState()[0]);
        await render();

        // Act
        (fixture.debugElement.query(By.css('app-dialog')) as any).triggerEventHandler('action', 'close');
        await render();

        // Assert
        expect(component.blockedIngredient()).toBeNull();
      });
    });

    describe('given ingredient table output events', () => {
      it('should wire edit, remove, save, and cancel actions', async () => {
        await createComponent();

        // Assemble
        const table = fixture.debugElement.query(By.css('app-ingredient-table'));

        // Act
        table.triggerEventHandler('action', { action: 'edit', row: pantryState()[0] });
        table.triggerEventHandler('quantityChange', { quantity: 5 });
        table.triggerEventHandler('action', { action: 'save', row: pantryState()[0] });
        table.triggerEventHandler('action', { action: 'cancel', row: pantryState()[0] });
        table.triggerEventHandler('action', { action: 'remove', row: pantryState()[0] });

        // Assert
        expect(component.editingIngredientId()).toBeNull();
      });
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NewRecipeView } from './new-recipe-view';
import { IngredientCatalogService } from '../../../services/data/ingredient-catalog.service';
import { MenuService } from '../../../services/page-helpers/menu/menu.service';
import type { Recipe, SharedIngredient } from '../../../services/data/shared-types';

describe('NewRecipeView', () => {
  const catalogState = signal<SharedIngredient[]>([]);
  const availableRecipesState = signal<Recipe[]>([]);
  const addIngredient = vi.fn(async (name: string) => {
    const ingredient = { id: `${name.toLowerCase()}-id`, name, image: '' };
    catalogState.update((items) => [...items, ingredient]);
    return ingredient;
  });

  const ingredientCatalog = {
    find: vi.fn((id: string) => catalogState().find((ingredient) => ingredient.id === id)),
    findByName: vi.fn((name: string) =>
      catalogState().find((ingredient) => ingredient.name.toLowerCase() === name.trim().toLowerCase()),
    ),
    search: vi.fn((query: string) => {
      const needle = query.trim().toLowerCase();
      if (needle.length < 3) return [];
      return catalogState().filter((ingredient) => ingredient.name.toLowerCase().startsWith(needle));
    }),
    add: addIngredient,
    nameFor: vi.fn((id: string) => ingredientCatalog.find(id)?.name ?? id),
    imageFor: vi.fn((id: string) => ingredientCatalog.find(id)?.image ?? ''),
  };

  const menu = {
    availableRecipes: vi.fn(() => availableRecipesState()),
  };

  let fixture: ComponentFixture<NewRecipeView>;
  let component: NewRecipeView;
  const saved = vi.fn();
  const cancelled = vi.fn();

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [NewRecipeView],
      providers: [
        { provide: IngredientCatalogService, useValue: ingredientCatalog },
        { provide: MenuService, useValue: menu },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewRecipeView);
    component = fixture.componentInstance;
    component.saved.subscribe(saved);
    component.cancelled.subscribe(cancelled);
    await fixture.whenStable();
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
    catalogState.set([
      { id: 'tomato', name: 'Tomato', image: '' },
      { id: 'onion', name: 'Onion', image: '' },
      { id: 'garlic', name: 'Garlic', image: '' },
      { id: 'basil', name: 'Basil', image: '' },
    ]);
    availableRecipesState.set([
      { id: 'soup', name: 'Soup', servings: 2, image: '', ingredients: { tomato: 2 } },
      { id: 'stew', name: 'Stew', servings: 4, image: '', ingredients: { onion: 1 } },
      { id: 'salsa', name: 'Salsa', servings: 1, image: '', ingredients: { tomato: 1 } },
    ]);
    addIngredient.mockClear();
    ingredientCatalog.find.mockClear();
    ingredientCatalog.findByName.mockClear();
    ingredientCatalog.search.mockClear();
    ingredientCatalog.nameFor.mockClear();
    ingredientCatalog.imageFor.mockClear();
    menu.availableRecipes.mockClear();
    saved.mockClear();
    cancelled.mockClear();
  });

  describe('recipe input', () => {
    describe('given a blank form', () => {
      it('should reset to create mode and clear recipe matches when a recipe is removed', async () => {
        await createComponent();

        // Assemble
        component.recipe = {
          id: 'soup',
          name: 'Soup',
          servings: 2,
          image: '',
          ingredients: { tomato: 2 },
        };
        component.recipe = null;

        // Act
        const canCreate = component.canCreateRecipe();

        // Assert
        expect(component.isEditing).toBe(false);
        expect(component.name).toBe('');
        expect(component.servings).toBe(1);
        expect(component.ingredients()).toEqual([{ ingredientId: '', ingredientName: '', quantity: 1 }]);
        expect(component.recipeMatches()).toEqual([]);
        expect(canCreate).toBe(false);
      });
    });

    describe('given an existing recipe', () => {
      it('should populate the edit form from the recipe', async () => {
        await createComponent();

        // Assemble
        const recipe: Recipe = {
          id: 'soup',
          name: 'Soup',
          servings: 2,
          image: '',
          ingredients: { tomato: 2, onion: 1 },
        };

        // Act
        component.recipe = recipe;

        // Assert
        expect(component.isEditing).toBe(true);
        expect(component.name).toBe('Soup');
        expect(component.servings).toBe(2);
        expect(component.ingredients()).toEqual([
          { ingredientId: 'tomato', ingredientName: 'Tomato', quantity: 2 },
          { ingredientId: 'onion', ingredientName: 'Onion', quantity: 1 },
        ]);
      });
    });
  });

  describe('recipe name', () => {
    describe('given edit mode', () => {
      it('should update the name without clearing the selected recipe', async () => {
        await createComponent();
        component.recipe = {
          id: 'soup',
          name: 'Soup',
          servings: 2,
          image: '',
          ingredients: { tomato: 2 },
        };
        component.selectedRecipeId = 'soup';

        // Act
        component.updateRecipeName('Soup Deluxe');

        // Assert
        expect(component.name).toBe('Soup Deluxe');
        expect(component.selectedRecipeId).toBe('soup');
        expect(component.isEditing).toBe(true);
        expect(component.recipeMatches()).toEqual([]);
      });
    });

    describe('given create mode', () => {
      it('should clear selected recipe state and show matching recipes', async () => {
        await createComponent();

        // Assemble
        component.selectedRecipeId = 'soup';

        // Act
        component.updateRecipeName('Ri');
        component.updateRecipeName('Rig');

        // Assert
        expect(component.selectedRecipeId).toBeNull();
        expect(menu.availableRecipes).toHaveBeenCalled();
        expect(component.recipeMatches()).toEqual([]);
        expect(component.canCreateRecipe()).toBe(true);
      });
    });
  });

  describe('ingredient rows', () => {
    describe('given a search term', () => {
      it('should search for ingredient suggestions and allow creation', async () => {
        await createComponent();

        // Assemble
        component.updateIngredient(0, 'ingredientName', 'Tom');

        // Act
        const matches = component.ingredientMatches(0);
        const canCreate = component.canCreateIngredient(0);

        // Assert
        expect(ingredientCatalog.search).toHaveBeenCalledWith('Tom');
        expect(matches.map((ingredient) => ingredient.name)).toEqual(['Tomato']);
        expect(canCreate).toBe(false);
      });
    });

    describe('given a missing ingredient row', () => {
      it('should return empty matches and block ingredient creation', async () => {
        await createComponent();

        // Act
        const matches = component.ingredientMatches(99);
        const canCreate = component.canCreateIngredient(99);

        // Assert
        expect(matches).toEqual([]);
        expect(canCreate).toBe(false);
      });
    });

    describe('given an unknown ingredient name', () => {
      it('should create a new ingredient and select it', async () => {
        await createComponent();

        // Assemble
        component.updateIngredient(0, 'ingredientName', 'Coriander');

        // Act
        await component.createIngredient(0);

        // Assert
        expect(addIngredient).toHaveBeenCalledWith('Coriander');
        expect(component.ingredients()[0]).toEqual({
          ingredientId: 'coriander-id',
          ingredientName: 'Coriander',
          quantity: 1,
        });
      });
    });

    describe('given no ingredient row at the requested index', () => {
      it('should stop creating an ingredient immediately', async () => {
        await createComponent();

        // Act
        await component.createIngredient(99);

        // Assert
        expect(addIngredient).not.toHaveBeenCalled();
      });
    });

    describe('given a short ingredient name', () => {
      it('should not create an ingredient when the name is too short', async () => {
        await createComponent();

        // Assemble
        component.updateIngredient(0, 'ingredientName', 'ab');

        // Act
        await component.createIngredient(0);

        // Assert
        expect(addIngredient).not.toHaveBeenCalled();
        expect(component.ingredients()[0]).toEqual({
          ingredientId: '',
          ingredientName: 'ab',
          quantity: 1,
        });
      });
    });

    describe('given a failed ingredient lookup', () => {
      it('should stop creating an ingredient when the catalog returns nothing', async () => {
        await createComponent();

        // Assemble
        ingredientCatalog.add.mockImplementationOnce(async () => null as never);
        component.updateIngredient(0, 'ingredientName', 'Parsley');

        // Act
        await component.createIngredient(0);

        // Assert
        expect(ingredientCatalog.add).toHaveBeenCalledWith('Parsley');
        expect(component.ingredients()[0]).toEqual({
          ingredientId: '',
          ingredientName: 'Parsley',
          quantity: 1,
        });
      });
    });

    describe('given an ingredient row', () => {
      it('should clear, add and remove ingredient rows', async () => {
        await createComponent();

        // Assemble
        component.addIngredient();
        component.updateIngredient(1, 'ingredientId', 'tomato');
        component.updateIngredient(1, 'ingredientName', 'Tomato');
        component.updateIngredient(1, 'quantity', 3);

        // Act
        component.clearIngredient(1);
        component.removeIngredient(0);

        // Assert
        expect(component.ingredients()).toEqual([
          { ingredientId: '', ingredientName: '', quantity: 3 },
        ]);
      });
    });

    describe('given multiple ingredient rows', () => {
      it('should update only the selected ingredient row', async () => {
        await createComponent();

        // Assemble
        component.addIngredient();

        // Act
        component.selectIngredient(1, { id: 'basil', name: 'Basil', image: '' });

        // Assert
        expect(component.ingredients()).toEqual([
          { ingredientId: '', ingredientName: '', quantity: 1 },
          { ingredientId: 'basil', ingredientName: 'Basil', quantity: 1 },
        ]);
      });
    });
  });

  describe('recipe selection', () => {
    describe('given a matching recipe', () => {
      it('should select the recipe and clear the create search state', async () => {
        await createComponent();

        // Assemble
        const recipe = availableRecipesState()[0];

        // Act
        component.selectRecipe(recipe);

        // Assert
        expect(component.selectedRecipeId).toBe('soup');
        expect(component.name).toBe('Soup');
        expect(component.servings).toBe(2);
        expect(component.ingredients()).toEqual([
          { ingredientId: 'tomato', ingredientName: 'Tomato', quantity: 2 },
        ]);
      });
    });

    describe('given a selected recipe', () => {
      it('should clear selected recipe state when reset', async () => {
        await createComponent();
        component.selectRecipe(availableRecipesState()[0]);

        // Act
        component.clearSelectedRecipe();

        // Assert
        expect(component.selectedRecipeId).toBeNull();
        expect(component.name).toBe('');
        expect(component.servings).toBe(1);
        expect(component.ingredients()).toEqual([{ ingredientId: '', ingredientName: '', quantity: 1 }]);
      });
    });

    describe('given multiple matching recipes', () => {
      it('should sort matches alphabetically', async () => {
        await createComponent();

        // Assemble
        availableRecipesState.set([
          { id: 'banana', name: 'Banana', servings: 1, image: '', ingredients: { tomato: 1 } },
          { id: 'cabana', name: 'Cabana', servings: 1, image: '', ingredients: { tomato: 1 } },
        ]);

        // Act
        component.updateRecipeName('ana');

        // Assert
        expect(component.recipeMatches().map((recipe) => recipe.name)).toEqual(['Banana', 'Cabana']);
      });
    });
  });

  describe('saving', () => {
    describe('given a valid new recipe', () => {
      it('should resolve ingredient ids, create missing ingredients, and emit saved data', async () => {
        await createComponent();

        // Assemble
        component.name = 'Fresh Pasta';
        component.servings = 3;
        component.updateIngredient(0, 'ingredientId', '');
        component.updateIngredient(0, 'ingredientName', 'Tomato');
        component.updateIngredient(0, 'quantity', 2);
        component.addIngredient();
        component.updateIngredient(1, 'ingredientId', '');
        component.updateIngredient(1, 'ingredientName', 'Shallot');
        component.updateIngredient(1, 'quantity', 1);

        // Act
        await component.save();

        // Assert
        expect(addIngredient).toHaveBeenCalledWith('Shallot');
        expect(saved).toHaveBeenCalledWith({
          id: null,
          recipe: {
            name: 'Fresh Pasta',
            servings: 3,
            image: '',
            ingredients: { tomato: 2, 'shallot-id': 1 },
          },
          sourceRecipeId: null,
        });
      });
    });

    describe('given an ingredient with zero quantity', () => {
      it('should ignore the ingredient and prevent saving an empty recipe', async () => {
        await createComponent();

        // Assemble
        component.name = 'Zero Dish';
        component.servings = 1;
        component.ingredients.set([
          { ingredientId: '', ingredientName: 'Tomato', quantity: 0 },
        ]);

        // Act
        await component.save();

        // Assert
        expect(saved).not.toHaveBeenCalled();
      });
    });

    describe('given an existing recipe id', () => {
      it('should keep the recipe id and not set a source recipe id', async () => {
        await createComponent();
        component.recipe = {
          id: 'soup',
          name: 'Soup',
          servings: 2,
          image: '',
          ingredients: { tomato: 2 },
        };
        component.name = 'Soup';
        component.servings = 2;

        // Act
        await component.save();

        // Assert
        expect(saved).toHaveBeenCalledWith({
          id: 'soup',
          recipe: {
            name: 'Soup',
            servings: 2,
            image: '',
            ingredients: { tomato: 2 },
          },
          sourceRecipeId: null,
        });
      });
    });

    describe('given a missing ingredient lookup', () => {
      it('should skip ingredients that cannot be created', async () => {
        await createComponent();

        // Assemble
        ingredientCatalog.add.mockImplementationOnce(async () => null as never);
        component.name = 'Missing Ingredient Dish';
        component.servings = 1;
        component.ingredients.set([
          { ingredientId: '', ingredientName: 'Unknown spice', quantity: 1 },
        ]);

        // Act
        await component.save();

        // Assert
        expect(saved).not.toHaveBeenCalled();
      });
    });

    describe('given invalid recipe data', () => {
      it('should not emit saved when the form is incomplete', async () => {
        await createComponent();

        // Act
        await component.save();

        // Assert
        expect(saved).not.toHaveBeenCalled();
      });
    });
  });

  describe('cancel actions', () => {
    describe('given the user clicks back or cancel', () => {
      it('should emit cancelled', async () => {
        await createComponent();

        // Act
        component.cancelled.emit();

        // Assert
        expect(cancelled).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('template rendering', () => {
    describe('given the default create state', () => {
      it('should render the create form and wire the back and cancel buttons', async () => {
        await createComponent();

        // Assemble
        await render();

        // Act
        (fixture.nativeElement.querySelector('.back-link') as HTMLButtonElement).click();
        (fixture.nativeElement.querySelector('.button.secondary') as HTMLButtonElement).click();
        (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        );

        // Assert
        expect(fixture.nativeElement.textContent).toContain('Create a recipe');
        expect(fixture.nativeElement.textContent).toContain('Add something delicious.');
        expect(fixture.nativeElement.textContent).toContain('Save recipe');
        expect(cancelled).toHaveBeenCalledTimes(2);
      });
    });

    describe('given create mode with no recipe matches', () => {
      it('should render the no-match helper text', async () => {
        await createComponent();

        // Assemble
        await setInputValue('input[name="name"]', 'Rig');

        // Act
        await render();

        // Assert
        expect(fixture.nativeElement.textContent).toContain(
          'No saved recipes match this name yet. Continue to create a new recipe.',
        );
      });
    });

    describe('given create mode with recipe matches', () => {
      it('should render matches and allow selecting a recipe from the suggestions', async () => {
        await createComponent();

        // Assemble
        availableRecipesState.set([
          { id: 'banana', name: 'Banana', servings: 1, image: '', ingredients: { tomato: 1 } },
          { id: 'cabana', name: 'Cabana', servings: 1, image: '', ingredients: { tomato: 1 } },
        ]);
        await setInputValue('input[name="name"]', 'ana');

        // Act
        expect(fixture.nativeElement.textContent).toContain('Matches');
        (fixture.nativeElement.querySelector('.suggestion-item') as HTMLButtonElement).click();
        await render();

        // Assert
        expect(component.selectedRecipeId).toBe('banana');
        expect(component.name).toBe('Banana');
      });
    });

    describe('given an editing recipe', () => {
      it('should render the edit form and save changes label', async () => {
        await createComponent();

        // Assemble
        component.recipe = {
          id: 'soup',
          name: 'Soup',
          servings: 2,
          image: '',
          ingredients: { tomato: 2 },
        };
        await render();

        // Act
        await setInputValue('input[name="name"]', 'Soup Deluxe');

        // Assert
        expect(fixture.nativeElement.textContent).toContain('Edit a recipe');
        expect(fixture.nativeElement.textContent).toContain('Refine your recipe.');
        expect(fixture.nativeElement.textContent).toContain('Save changes');
      });
    });

    describe('given a selected recipe', () => {
      it('should render the selected recipe summary and clear it from the change button', async () => {
        await createComponent();

        // Assemble
        component.selectRecipe(availableRecipesState()[0]);
        await render();

        // Act
        (fixture.nativeElement.querySelector('.recipe-name-selected__change') as HTMLButtonElement).click();
        await render();

        // Assert
        expect(fixture.nativeElement.textContent).toContain('Recipe name');
        expect(component.selectedRecipeId).toBeNull();
        expect(fixture.nativeElement.querySelector('.recipe-name-selected')).toBeNull();
      });
    });

    describe('given an ingredient with no match', () => {
      it('should render the inline create button and wire ingredient creation', async () => {
        await createComponent();

        // Assemble
        component.updateIngredient(0, 'ingredientName', 'Parsley');
        await render();

        // Act
        expect(fixture.nativeElement.textContent).toContain('Add "Parsley"');
        (fixture.nativeElement.querySelector('.add-ingredient__inline') as HTMLButtonElement).click();
        await render();

        // Assert
        expect(component.ingredients()[0]).toEqual({
          ingredientId: 'parsley-id',
          ingredientName: 'Parsley',
          quantity: 1,
        });
      });
    });

    describe('given an ingredient with a match', () => {
      it('should render ingredient suggestions and select a suggestion', async () => {
        await createComponent();

        // Assemble
        component.updateIngredient(0, 'ingredientName', 'Tom');
        await render();

        // Act
        expect(fixture.nativeElement.textContent).toContain('Matches');
        (fixture.nativeElement.querySelector('.ingredient-row__suggestions .suggestion-item') as HTMLButtonElement).click();
        await render();

        // Assert
        expect(component.ingredients()[0]).toEqual({
          ingredientId: 'tomato',
          ingredientName: 'Tomato',
          quantity: 1,
        });
      });
    });

    describe('given multiple ingredients', () => {
      it('should render remove controls and allow removing a row', async () => {
        await createComponent();

        // Assemble
        (fixture.nativeElement.querySelector('.add-ingredient') as HTMLButtonElement).click();
        await render();

        // Act
        (fixture.nativeElement.querySelector('.ingredient-row__remove') as HTMLButtonElement).click();
        await render();

        // Assert
        expect(fixture.nativeElement.querySelectorAll('.ingredient-row__remove').length).toBe(0);
      });
    });
  });
});

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuPage } from './menu-page';
import { IngredientCatalogService } from '../../services/data/ingredient-catalog.service';
import { MenuService } from '../../services/page-helpers/menu/menu.service';
import type { Recipe, SharedIngredient } from '../../services/data/shared-types';

describe('MenuPage render', () => {
  const recipesState = signal<Recipe[]>([]);
  const availableRecipesState = signal<Recipe[]>([]);
  const catalogState = signal<SharedIngredient[]>([
    { id: 'tomato', name: 'Tomato', image: '' },
    { id: 'onion', name: 'Onion', image: '' },
    { id: 'garlic', name: 'Garlic', image: '' },
  ]);

  const setRecipes = (recipes: Recipe[]): void => {
    recipesState.set(recipes);
    availableRecipesState.set(recipes);
  };

  const menu = {
    recipes: () => recipesState(),
    availableRecipes: () => availableRecipesState(),
    reset: vi.fn(async () => {
      setRecipes([]);
    }),
    add: vi.fn(async (recipe: Omit<Recipe, 'id'>, sourceRecipeId: string | null = null) => {
      const next: Recipe = {
        id: `${recipe.name.toLowerCase().replace(/\s+/g, '-')}-${recipesState().length + 1}`,
        ...recipe,
        ...(sourceRecipeId ? { sourceRecipeId } : {}),
      };
      setRecipes([...recipesState(), next]);
    }),
    updateRecipe: vi.fn(async (id: string, recipe: Omit<Recipe, 'id'>) => {
      setRecipes(
        recipesState().map((item) =>
          item.id === id ? { ...item, ...recipe, id, sourceRecipeId: item.sourceRecipeId } : item,
        ),
      );
    }),
    remove: vi.fn(async (id: string) => {
      setRecipes(recipesState().filter((recipe) => recipe.id !== id));
    }),
  };

  const ingredientCatalog = {
    find: vi.fn((id: string) => catalogState().find((ingredient) => ingredient.id === id)),
    findByName: vi.fn((name: string) =>
      catalogState().find((ingredient) => ingredient.name.toLowerCase() === name.trim().toLowerCase()),
    ),
    search: vi.fn((query: string) => {
      const needle = query.trim().toLowerCase();
      if (needle.length < 3) return [];
      return catalogState().filter((ingredient) => ingredient.name.toLowerCase().includes(needle));
    }),
    add: vi.fn(async (name: string) => {
      const ingredient = { id: `${name.toLowerCase().replace(/\s+/g, '-')}-id`, name, image: '' };
      catalogState.set([...catalogState(), ingredient]);
      return ingredient;
    }),
    nameFor: vi.fn((id: string) => ingredientCatalog.find(id)?.name ?? id),
    imageFor: vi.fn((id: string) => ingredientCatalog.find(id)?.image ?? ''),
  };

  let fixture: ComponentFixture<MenuPage>;
  let component: MenuPage;

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [MenuPage],
      providers: [
        { provide: MenuService, useValue: menu },
        { provide: IngredientCatalogService, useValue: ingredientCatalog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuPage);
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
    await render();
  };

  const setInputValue = async (selector: string, value: string): Promise<void> => {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement | null;
    if (!input) throw new Error(`Missing input: ${selector}`);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await render();
  };

  beforeEach(() => {
    setRecipes([]);
    catalogState.set([
      { id: 'tomato', name: 'Tomato', image: '' },
      { id: 'onion', name: 'Onion', image: '' },
      { id: 'garlic', name: 'Garlic', image: '' },
    ]);
    menu.reset.mockClear();
    menu.add.mockClear();
    menu.updateRecipe.mockClear();
    menu.remove.mockClear();
    ingredientCatalog.find.mockClear();
    ingredientCatalog.findByName.mockClear();
    ingredientCatalog.search.mockClear();
    ingredientCatalog.add.mockClear();
    ingredientCatalog.nameFor.mockClear();
    ingredientCatalog.imageFor.mockClear();
  });

  describe('given no recipes are available', () => {
    it('should render the empty state and open the create form', async () => {
      // Assemble
      await createComponent();

      // Act
      await render();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('0 recipes available');
      expect(fixture.nativeElement.textContent).toContain('Your menu is ready for its first recipe.');
      expect(fixture.nativeElement.querySelectorAll('app-recipe-card').length).toBe(0);

      // Act
      await clickAndRender('.empty-state .button.primary');
      await setInputValue('app-new-recipe-view input[name="name"]', 'Soupish');

      // Assert
      expect(component.isRecipeFormOpen()).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Create a recipe');
      expect(fixture.nativeElement.textContent).toContain('Add something delicious.');
      expect(fixture.nativeElement.textContent).toContain('No saved recipes match this name yet. Continue to create a new recipe.');

      // Act
      await setInputValue('app-new-recipe-view [aria-label="Ingredient 1"]', 'Tomato');
      await clickAndRender('app-new-recipe-view .form-actions .button.primary');

      // Assert
      expect(menu.add).toHaveBeenCalledWith(
        {
          name: 'Soupish',
          servings: 1,
          image: '',
          ingredients: { tomato: 1 },
        },
        null,
      );
      expect(component.isRecipeFormOpen()).toBe(false);
      expect(fixture.nativeElement.querySelector('app-new-recipe-view')).toBeFalsy();
    });
  });

  describe('given recipes are available', () => {
    const soup: Recipe = {
      id: 'soup',
      name: 'Soup',
      servings: 2,
      image: '',
      ingredients: { tomato: 2, onion: 1 },
      origin: 'shared',
    };
    const salad: Recipe = {
      id: 'salad',
      name: 'Salad',
      servings: 1,
      image: '',
      ingredients: { garlic: 1 },
      origin: 'custom',
    };

    beforeEach(() => {
      setRecipes([soup, salad]);
      availableRecipesState.set([soup, salad]);
    });

    it('should render recipe cards, the edit form, and the remove dialog', async () => {
      // Assemble
      await createComponent();

      // Act
      await render();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('2 recipes available');
      expect(fixture.nativeElement.textContent).toContain('Your recipes');
      expect(fixture.nativeElement.textContent).toContain('Soup');
      expect(fixture.nativeElement.textContent).toContain('Salad');
      expect(fixture.nativeElement.querySelectorAll('app-recipe-card').length).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('Original');
      expect(fixture.nativeElement.textContent).toContain('Custom');

      // Act
      await clickAndRender('.actions .button.primary');
      await setInputValue('app-new-recipe-view input[name="name"]', 'Sou');
      await clickAndRender('app-new-recipe-view .suggestion-item');

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Recipe name');
      expect(fixture.nativeElement.textContent).toContain('Soup');
      expect(fixture.nativeElement.textContent).toContain('Change');
    });

    it('should render the edit form and remove dialog', async () => {
      // Assemble
      await createComponent();

      // Act
      await render();
      await clickAndRender('app-recipe-card .card-actions .card-action');

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Edit a recipe');
      expect(fixture.nativeElement.textContent).toContain('Refine your recipe.');
      expect(fixture.nativeElement.textContent).toContain('Save changes');

      // Act
      await clickAndRender('app-new-recipe-view .form-actions .button.primary');

      // Assert
      expect(menu.updateRecipe).toHaveBeenCalledWith('soup', {
        name: 'Soup',
        servings: 2,
        image: '',
        ingredients: { tomato: 2, onion: 1 },
      });
      expect(component.isRecipeFormOpen()).toBe(false);

      // Act
      await clickAndRender('app-recipe-card .card-action.remove');

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Remove Soup?');

      // Act
      await clickAndRender('app-dialog .button.secondary');
      await clickAndRender('app-recipe-card .card-action.remove');
      await clickAndRender('app-dialog .button.danger');

      // Assert
      expect(menu.remove).toHaveBeenCalledWith('soup');
      expect(component.recipeToRemove()).toBeNull();
      expect(fixture.nativeElement.querySelector('app-dialog')).toBeFalsy();
    });
  });
});

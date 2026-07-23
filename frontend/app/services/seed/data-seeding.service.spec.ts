import { TestBed } from '@angular/core/testing';
import { ApiClientService } from '../core/api/api-client.service';
import { AuthService } from '../core/auth/auth.service';
import { defaultIngredients, defaultPantryIngredients, defaultRecipes } from './seed-data';
import { DataSeedingService } from './data-seeding.service';

describe('DataSeedingService', () => {
  const api = {
    getIngredients: vi.fn(),
    createIngredient: vi.fn(),
    getRecipes: vi.fn(),
    createRecipe: vi.fn(),
    getPersonalRecipes: vi.fn(),
    createPersonalRecipe: vi.fn(),
    getPantry: vi.fn(),
    replacePantry: vi.fn(),
    getMenu: vi.fn(),
    replaceMenu: vi.fn(),
  };

  const configure = (authenticated: boolean): DataSeedingService => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiClientService, useValue: api },
        {
          provide: AuthService,
          useValue: {
            ready: () => authenticated,
            isAuthenticated: () => authenticated,
          },
        },
      ],
    });
    return TestBed.inject(DataSeedingService);
  };

  beforeEach(() => Object.values(api).forEach((method) => method.mockReset()));

  it('does nothing until an authenticated user is available', async () => {
    await configure(false).seed();

    expect(api.getIngredients).not.toHaveBeenCalled();
  });

  it('seeds empty API resources using the IDs returned by the API', async () => {
    api.getIngredients.mockResolvedValue([]);
    api.createIngredient.mockImplementation(async ({ name }: { name: string }) => ({
      id: `ingredient-${name.toLowerCase()}`,
      name,
      image: '',
    }));
    api.getRecipes.mockResolvedValue([]);
    api.createRecipe.mockResolvedValue({});
    api.getPersonalRecipes.mockResolvedValue([]);
    let recipeIndex = 0;
    api.createPersonalRecipe.mockImplementation(async () => ({ id: `recipe-${recipeIndex++}` }));
    api.getPantry.mockResolvedValue({ values: {} });
    api.replacePantry.mockResolvedValue({ values: {} });
    api.getMenu.mockResolvedValue({ selectedRecipeIds: [] });
    api.replaceMenu.mockResolvedValue({ selectedRecipeIds: [] });

    await configure(true).seed();

    expect(api.createIngredient).toHaveBeenCalledTimes(defaultIngredients().length);
    expect(api.createRecipe).toHaveBeenCalledTimes(defaultRecipes().length);
    expect(api.createPersonalRecipe).toHaveBeenCalledTimes(defaultRecipes().length);
    expect(api.createRecipe.mock.calls[0][0].ingredients).toEqual(
      expect.objectContaining({ 'ingredient-meat': 1 }),
    );
    expect(api.replacePantry).toHaveBeenCalledWith(
      Object.fromEntries(
        defaultPantryIngredients().map((ingredient) => [
          `ingredient-${ingredient.name.toLowerCase()}`,
          ingredient.quantity,
        ]),
      ),
    );
    expect(api.replaceMenu).toHaveBeenCalledWith(
      defaultRecipes().map((_, index) => `recipe-${index}`),
    );
  });

  it('does not replace resources that already contain data', async () => {
    api.getIngredients.mockResolvedValue(defaultIngredients());
    api.getRecipes.mockResolvedValue([{ id: 'shared' }]);
    api.getPersonalRecipes.mockResolvedValue([{ id: 'personal' }]);
    api.getPantry.mockResolvedValue({ values: { tomato: 1 } });
    api.getMenu.mockResolvedValue({ selectedRecipeIds: ['personal'] });

    await configure(true).seed();

    expect(api.createIngredient).not.toHaveBeenCalled();
    expect(api.createRecipe).not.toHaveBeenCalled();
    expect(api.createPersonalRecipe).not.toHaveBeenCalled();
    expect(api.replacePantry).not.toHaveBeenCalled();
    expect(api.replaceMenu).not.toHaveBeenCalled();
  });
});

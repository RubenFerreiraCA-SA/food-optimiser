import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { RecipeCatalogService } from './recipe-catalog.service';

describe('RecipeCatalogService', () => {
  const ready = signal(false);
  const user = signal<{ uid: string } | null>(null);
  const api = {
    getRecipes: vi.fn(),
    getPersonalRecipes: vi.fn(),
    createPersonalRecipe: vi.fn(),
    updatePersonalRecipe: vi.fn(),
    deletePersonalRecipe: vi.fn(),
  };

  const createService = async (): Promise<RecipeCatalogService> => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ApiClientService, useValue: api },
        { provide: AuthService, useValue: { ready: () => ready(), user: () => user() } },
      ],
    }).compileComponents();
    return TestBed.inject(RecipeCatalogService);
  };

  beforeEach(() => {
    ready.set(false);
    user.set(null);
    Object.values(api).forEach((method) => method.mockReset());
  });

  it('loads, sorts, and searches shared and personal recipes', async () => {
    api.getRecipes.mockResolvedValue([
      { id: 'shared', name: 'Zucchini', servings: 2, image: '', ingredients: {} },
    ]);
    api.getPersonalRecipes.mockResolvedValue([
      { id: 'personal', name: 'Apple pie', servings: 4, image: '', ingredients: {} },
    ]);
    const service = await createService();
    ready.set(true);
    user.set({ uid: 'user-1' });
    TestBed.flushEffects();
    await Promise.resolve();
    await Promise.resolve();

    expect(service.recipes().map((recipe) => recipe.id)).toEqual(['personal', 'shared']);
    expect(service.find('shared')?.name).toBe('Zucchini');
    expect(service.isPersonal('personal')).toBe(true);
  });

  it('writes personal recipes through the API and refreshes the catalog', async () => {
    api.createPersonalRecipe.mockResolvedValue({ id: 'created' });
    api.getRecipes.mockResolvedValue([]);
    api.getPersonalRecipes.mockResolvedValue([]);
    const service = await createService();

    await service.add({ name: 'Toast', servings: 1, image: '', ingredients: {} });

    expect(api.createPersonalRecipe).toHaveBeenCalledWith({
      name: 'Toast',
      servings: 1,
      image: '',
      ingredients: {},
      sourceRecipeId: null,
    });
  });
});

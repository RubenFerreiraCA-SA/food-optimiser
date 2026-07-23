import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiClientService } from '../api/api-client.service';
import { AuthService } from '../auth/auth.service';
import { IngredientCatalogService } from './ingredient-catalog.service';
import type { SharedIngredient } from './shared-types';

describe('IngredientCatalogService', () => {
  const readyState = signal(false);
  const userState = signal<{ uid: string } | null>(null);
  const getIngredients = vi.fn(async () => [] as SharedIngredient[]);
  const createIngredient = vi.fn(async (request: { name: string; image: string }) => ({
    id: request.name.toLowerCase(),
    name: request.name,
    image: request.image,
  }));

  const auth = {
    ready: () => readyState(),
    user: () => userState(),
  };

  const api = {
    getIngredients,
    createIngredient,
  };

  const createService = async (): Promise<IngredientCatalogService> => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ApiClientService, useValue: api },
      ],
    }).compileComponents();

    return TestBed.inject(IngredientCatalogService);
  };

  beforeEach(() => {
    readyState.set(false);
    userState.set(null);
    getIngredients.mockClear();
    createIngredient.mockClear();
  });

  describe('given auth is not ready', () => {
    it('should not refresh the ingredient catalog', async () => {
      // Assemble
      const service = await createService();

      // Act
      await Promise.resolve();

      // Assert
      expect(getIngredients).not.toHaveBeenCalled();
      expect(service.ingredients()).toEqual([]);
    });
  });

  describe('given auth becomes ready during construction', () => {
    it('should refresh automatically from the constructor effect', async () => {
      // Arrange
      getIngredients.mockResolvedValueOnce([
        { id: 'parsley', name: 'Parsley', image: '' },
        { id: 'basil', name: 'Basil', image: '' },
      ]);
      readyState.set(false);
      userState.set({ uid: 'user-1' });

      // Act
      const service = await createService();
      readyState.set(true);
      TestBed.flushEffects();
      await Promise.resolve();

      // Assert
      expect(getIngredients).toHaveBeenCalledTimes(1);
      expect(service.ingredients()).toEqual([
        { id: 'basil', name: 'Basil', image: '' },
        { id: 'parsley', name: 'Parsley', image: '' },
      ]);
    });
  });

  describe('given auth is ready', () => {
    it('should refresh, sort, look up, search, and add ingredients', async () => {
      getIngredients.mockResolvedValueOnce([
        { id: 'parsley', name: 'Parsley', image: '' },
        { id: 'basil', name: 'Basil', image: '' },
        { id: 'tomato', name: 'Tomato', image: 'tomato.png' },
      ]);
      readyState.set(false);
      userState.set({ uid: 'user-1' });

      // Assemble
      const service = await createService();

      // Act
      readyState.set(true);
      TestBed.flushEffects();
      await Promise.resolve();
      const blankAdd = await service.add('   ');
      const existingAdd = await service.add('Basil');
      const createdAdd = await service.add('Coriander');
      const byId = service.find('tomato');
      const byName = service.findByName('  basil  ');
      const shortSearch = service.search('ba');
      const search = service.search('par');
      const nameFor = service.nameFor('tomato');
      const imageFor = service.imageFor('tomato');

      // Assert
      expect(getIngredients).toHaveBeenCalledTimes(1);
      expect(service.ingredients()).toEqual([
        { id: 'basil', name: 'Basil', image: '' },
        { id: 'coriander', name: 'Coriander', image: '' },
        { id: 'parsley', name: 'Parsley', image: '' },
        { id: 'tomato', name: 'Tomato', image: 'tomato.png' },
      ]);
      expect(blankAdd).toBeNull();
      expect(existingAdd).toEqual({ id: 'basil', name: 'Basil', image: '' });
      expect(createdAdd).toEqual({ id: 'coriander', name: 'Coriander', image: '' });
      expect(createIngredient).toHaveBeenCalledWith({ name: 'Coriander', image: '' });
      expect(byId).toEqual({ id: 'tomato', name: 'Tomato', image: 'tomato.png' });
      expect(byName).toEqual({ id: 'basil', name: 'Basil', image: '' });
      expect(shortSearch).toEqual([]);
      expect(search).toEqual([{ id: 'parsley', name: 'Parsley', image: '' }]);
      expect(nameFor).toBe('Tomato');
      expect(imageFor).toBe('tomato.png');
    });
  });

  describe('given a refresh failure', () => {
    it('should log and keep the catalog empty', async () => {
      const error = new Error('boom');
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      getIngredients.mockRejectedValueOnce(error);
      readyState.set(false);
      userState.set({ uid: 'user-1' });

      // Assemble
      const service = await createService();

      // Act
      readyState.set(true);
      TestBed.flushEffects();
      await Promise.resolve();
      const search = service.search('tom');

      // Assert
      expect(consoleError).toHaveBeenCalledWith('Failed to load ingredient catalog from API:', error);
      expect(service.ingredients()).toEqual([]);
      expect(search).toEqual([]);
      consoleError.mockRestore();
    });
  });
});

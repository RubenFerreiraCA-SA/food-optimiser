import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { DataService } from '../data.service';
import { DataSeedingService } from './data-seeding.service';
import { defaultIngredients, defaultPantryIngredients, defaultRecipes } from './seed-data';
import { GLOBAL_COLLECTIONS, PROFILE_DOC_ID, USER_COLLECTIONS, USER_DATA_DOCS } from '../user-data';

describe('SeedService', () => {
  it('seeds missing records without replacing existing data', async () => {
    const key = (scope: 'user' | 'global', collectionName: string) => `${scope}:${collectionName}`;
    const collections = new Map<string, Map<string, unknown>>([
      [key('global', GLOBAL_COLLECTIONS.recipes), new Map<string, unknown>([['saved', { id: 'saved' }]])],
    ]);
    const data = {
      revision: signal(0),
      hasDocument: (collectionName: string, docId: string, scope: 'user' | 'global' = 'user') =>
        collections.get(key(scope, collectionName))?.has(docId) ?? false,
      collectionSize: (collectionName: string, scope: 'user' | 'global' = 'user') =>
        collections.get(key(scope, collectionName))?.size ?? 0,
      upsertDocument: (
        collectionName: string,
        docId: string,
        value: unknown,
        scope: 'user' | 'global' = 'user',
      ) => {
        const collectionKey = key(scope, collectionName);
        const collection = collections.get(collectionKey) ?? new Map<string, unknown>();
        collection.set(docId, value);
        collections.set(collectionKey, collection);
      },
      replaceCollection: (
        collectionName: string,
        value: Array<{ id: string }>,
        scope: 'user' | 'global' = 'user',
      ) => {
        collections.set(key(scope, collectionName), new Map<string, unknown>(value.map((item) => [item.id, item])));
      },
      whenReady: () => Promise.resolve(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: DataService, useValue: data },
        {
          provide: AuthService,
          useValue: {
            ready: () => true,
            isAuthenticated: () => true,
            user: () => ({ uid: 'user-1' }),
          },
        },
      ],
    });

    const service = TestBed.inject(DataSeedingService);
    await service.seed();

    expect(Array.from(collections.get(key('global', GLOBAL_COLLECTIONS.recipes))?.values() ?? [])).toEqual([
      { id: 'saved' },
    ]);
    expect(collections.get(key('global', GLOBAL_COLLECTIONS.ingredients))?.size).toBe(defaultIngredients().length);
    expect(collections.get(key('user', USER_COLLECTIONS.data))?.get(USER_DATA_DOCS.ingredients)).toEqual(
      Object.fromEntries(defaultPantryIngredients().map((ingredient) => [ingredient.id, ingredient.quantity])),
    );
    expect(collections.get(key('user', USER_COLLECTIONS.data))?.get(USER_DATA_DOCS.recipes)).toEqual(
      { values: defaultRecipes().map((recipe) => recipe.id) },
    );
    expect(collections.get(key('user', USER_COLLECTIONS.profile))?.get(PROFILE_DOC_ID)).toEqual(
      expect.objectContaining({
        uid: 'user-1',
        displayName: 'Guest',
      }),
    );
  });
});

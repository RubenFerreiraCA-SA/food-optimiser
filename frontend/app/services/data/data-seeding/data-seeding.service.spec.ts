import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { DataService } from '../data.service';
import { DataSeedingService } from './data-seeding.service';
import { defaultIngredients, defaultPantryIngredients, defaultRecipes } from './seed-data';
import { GLOBAL_COLLECTIONS, PROFILE_DOC_ID, USER_COLLECTIONS, USER_DATA_DOCS } from '../user-data';

describe('SeedService', () => {
  it('does nothing when auth is not ready or not authenticated', async () => {
    const data = {
      whenReady: vi.fn(async () => undefined),
      collectionSize: vi.fn(),
      hasDocument: vi.fn(),
      upsertDocument: vi.fn(),
      replaceCollection: vi.fn(),
      readCollection: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DataService, useValue: data },
        {
          provide: AuthService,
          useValue: {
            ready: () => false,
            isAuthenticated: () => false,
            user: () => null,
          },
        },
      ],
    });

    const service = TestBed.inject(DataSeedingService);
    await service.seed();

    expect(data.whenReady).not.toHaveBeenCalled();
    expect(data.replaceCollection).not.toHaveBeenCalled();
    expect(data.upsertDocument).not.toHaveBeenCalled();
  });

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
      ) =>
        value.map((item, index) => {
          const next = { ...item, id: `${collectionName}-${index}` };
          const collectionKey = key(scope, collectionName);
          const collection = collections.get(collectionKey) ?? new Map<string, unknown>();
          collection.set(next.id, next);
          collections.set(collectionKey, collection);
          return next;
        }),
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
    expect(collections.get(key('user', USER_COLLECTIONS.recipes))?.size).toBe(defaultRecipes().length);
    expect(collections.get(key('user', USER_COLLECTIONS.data))?.get(USER_DATA_DOCS.ingredients)).toEqual(
      Object.fromEntries(defaultPantryIngredients().map((ingredient) => [ingredient.id, ingredient.quantity])),
    );
    expect(collections.get(key('user', USER_COLLECTIONS.data))?.get(USER_DATA_DOCS.recipes)).toEqual({
      values: defaultRecipes().map((_, index) => `recipes-${index}`),
    });
    expect(collections.get(key('user', USER_COLLECTIONS.profile))?.get(PROFILE_DOC_ID)).toEqual(
      expect.objectContaining({
        uid: 'user-1',
        displayName: 'Guest',
      }),
    );
  });

  it('keeps existing seeded data in place', async () => {
    const key = (scope: 'user' | 'global', collectionName: string) => `${scope}:${collectionName}`;
    const collections = new Map<string, Map<string, unknown>>([
      [
        key('global', GLOBAL_COLLECTIONS.ingredients),
        new Map<string, unknown>([['tomato', { id: 'tomato', name: 'Tomato' }]]),
      ],
      [
        key('global', GLOBAL_COLLECTIONS.recipes),
        new Map<string, unknown>([['shared', { id: 'shared' }]]),
      ],
      [
        key('user', USER_COLLECTIONS.recipes),
        new Map<string, unknown>([['custom', { id: 'custom', name: 'Custom Soup' }]]),
      ],
      [
        key('user', USER_COLLECTIONS.data),
        new Map<string, unknown>([
          [USER_DATA_DOCS.ingredients, { values: { tomato: 1 } }],
          [USER_DATA_DOCS.recipes, { values: ['custom'] }],
        ]),
      ],
      [key('user', USER_COLLECTIONS.profile), new Map<string, unknown>([[PROFILE_DOC_ID, { uid: 'user-1' }]])],
    ]);
    const data = {
      whenReady: vi.fn(async () => undefined),
      collectionSize: vi.fn((collectionName: string, scope: 'user' | 'global' = 'user') =>
        collections.get(key(scope, collectionName))?.size ?? 0,
      ),
      hasDocument: vi.fn((collectionName: string, docId: string, scope: 'user' | 'global' = 'user') =>
        collections.get(key(scope, collectionName))?.has(docId) ?? false,
      ),
      upsertDocument: vi.fn(),
      replaceCollection: vi.fn(),
      readCollection: vi.fn((collectionName: string, fallback: Array<{ id: string }>, scope: 'user' | 'global' = 'user') => {
        const collection = collections.get(key(scope, collectionName));
        if (!collection) return fallback;
        return Array.from(collection.values()) as Array<{ id: string }>;
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DataService, useValue: data },
        {
          provide: AuthService,
          useValue: {
            ready: () => true,
            isAuthenticated: () => true,
            user: () => ({ uid: 'user-1', displayName: 'Existing User' }),
          },
        },
      ],
    });

    const service = TestBed.inject(DataSeedingService);
    await service.seed();

    expect(data.replaceCollection).not.toHaveBeenCalled();
    expect(data.upsertDocument).not.toHaveBeenCalled();
    expect(collections.get(key('global', GLOBAL_COLLECTIONS.ingredients))?.get('tomato')).toEqual({
      id: 'tomato',
      name: 'Tomato',
    });
    expect(collections.get(key('user', USER_COLLECTIONS.profile))?.get(PROFILE_DOC_ID)).toEqual({
      uid: 'user-1',
    });
  });
});

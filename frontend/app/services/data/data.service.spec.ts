import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { DataService } from './data.service';
import { GLOBAL_COLLECTIONS, USER_COLLECTIONS } from './user-data';

const firestoreMocks = vi.hoisted(() => {
  const getDocs = vi.fn();
  const setDoc = vi.fn(async () => undefined);
  const deleteDoc = vi.fn(async () => undefined);
  const collection = vi.fn((...parts: unknown[]) => ({ path: parts.slice(1) as string[] }));
  const doc = vi.fn((ref: { path: string[] }, id: string) => ({ path: [...ref.path, id] }));
  const getFirestore = vi.fn(() => ({ firestore: true }));
  const connectFirestoreEmulator = vi.fn();

  return {
    getDocs,
    setDoc,
    deleteDoc,
    collection,
    doc,
    getFirestore,
    connectFirestoreEmulator,
  };
});

vi.mock('firebase/firestore', () => firestoreMocks);

function createSnapshot(records: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    forEach(callback: (record: { id: string; data: () => Record<string, unknown> }) => void) {
      records.forEach((record) => callback({ id: record.id, data: () => record.data }));
    },
  };
}

describe('DataService', () => {
  const userState = signal<{ uid: string } | null>(null);
  const initialize = vi.fn(async () => undefined);

  const auth = {
    initialize,
    user: () => userState(),
  };

  const createService = async (): Promise<DataService> => {
    await TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }],
    }).compileComponents();

    return TestBed.inject(DataService);
  };

  beforeEach(() => {
    userState.set(null);
    initialize.mockClear();
    firestoreMocks.getDocs.mockReset();
    firestoreMocks.setDoc.mockClear();
    firestoreMocks.deleteDoc.mockClear();
    firestoreMocks.collection.mockClear();
    firestoreMocks.doc.mockClear();
    firestoreMocks.getFirestore.mockClear();
    firestoreMocks.connectFirestoreEmulator.mockClear();
  });

  describe('given no authenticated user', () => {
    it('should return fallback data for missing collections and documents', async () => {
      // Assemble
      const service = await createService();
      TestBed.flushEffects();
      await service.whenReady();

      // Act
      const fallbackCollection = [
        {
          id: 'fallback',
          name: 'Fallback',
        },
      ];
      const fallbackDocument = { id: 'fallback', value: true };
      const collection = service.readCollection('recipes', fallbackCollection);
      const document = service.readDocument('profile', 'main', fallbackDocument);

      // Assert
      expect(collection).toBe(fallbackCollection);
      expect(document).toBe(fallbackDocument);
      expect(service.hasCollection('recipes')).toBe(false);
      expect(service.hasDocument('recipes', 'main')).toBe(false);
      expect(service.collectionSize('recipes')).toBe(0);
    });

    it('should replace a user scoped collection without syncing', async () => {
      // Assemble
      const service = await createService();
      await service.whenReady();

      // Act
      const replaced = service.replaceCollection(USER_COLLECTIONS.recipes, [
        {
          name: 'Lunch',
          servings: 2,
          image: '',
          ingredients: { salad: 1 },
        },
      ]);

      // Assert
      expect(replaced).toHaveLength(1);
      expect(service.readCollection(USER_COLLECTIONS.recipes, [], 'user')).toEqual(replaced);
      expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
      expect(firestoreMocks.deleteDoc).not.toHaveBeenCalled();
    });

    it('should replace a global collection without syncing', async () => {
      // Assemble
      const service = await createService();
      TestBed.flushEffects();
      await service.whenReady();

      // Act
      const replaced = service.replaceCollection(GLOBAL_COLLECTIONS.recipes, [
        {
          name: 'Soup',
          servings: 2,
          image: '',
          ingredients: { tomato: 2 },
        },
      ], 'global');

      // Assert
      expect(replaced).toHaveLength(1);
      expect(service.readCollection(GLOBAL_COLLECTIONS.recipes, [], 'global')).toEqual(replaced);
      expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
      expect(firestoreMocks.deleteDoc).not.toHaveBeenCalled();
    });
  });

  describe('given loaded Firestore data', () => {
    it('should initialize and read the loaded collections and documents', async () => {
      userState.set({ uid: 'user-1' });
      firestoreMocks.getDocs.mockImplementation(async (ref: { path: string[] }) => {
        const key = ref.path.join('/');
        if (key === 'users/user-1/profile') {
          return createSnapshot([
            {
              id: 'main',
              data: {
                uid: 'user-1',
                displayName: 'Ruben',
                email: 'ruben@example.com',
              },
            },
          ]);
        }
        if (key === 'users/user-1/data') {
          return createSnapshot([
            {
              id: 'ingredients',
              data: { values: { tomato: 2 } },
            },
          ]);
        }
        if (key === 'users/user-1/recipes') {
          return createSnapshot([
            {
              id: 'soup',
              data: { name: 'Soup', servings: 2, image: '', ingredients: { tomato: 2 } },
            },
          ]);
        }
        if (key === 'recipes') {
          return createSnapshot([
            {
              id: 'shared-soup',
              data: { name: 'Shared Soup', servings: 4, image: '', ingredients: { tomato: 4 } },
            },
          ]);
        }
        if (key === 'ingredients') {
          return createSnapshot([
            {
              id: 'tomato',
              data: { name: 'Tomato', image: '' },
            },
          ]);
        }
        return createSnapshot([]);
      });

      // Assemble
      const service = await createService();

      // Act
      TestBed.flushEffects();
      await service.initialize();

      // Assert
      expect(initialize).toHaveBeenCalledTimes(1);
      expect(service.readDocument('profile', 'main', { uid: 'fallback' })).toEqual(
        expect.objectContaining({
          uid: 'user-1',
          displayName: 'Ruben',
        }),
      );
      expect(service.readDocument('data', 'ingredients', { values: {} })).toEqual({
        values: { tomato: 2 },
      });
      expect(service.readCollection('recipes', [], 'user')).toEqual([
        { id: 'soup', name: 'Soup', servings: 2, image: '', ingredients: { tomato: 2 } },
      ]);
      expect(service.readCollection('ingredients', [], 'global')).toEqual([
        { id: 'tomato', name: 'Tomato', image: '' },
      ]);
      expect(service.hasCollection('recipes')).toBe(true);
      expect(service.hasDocument('recipes', 'soup')).toBe(true);
      expect(service.collectionSize('recipes')).toBe(1);
    });

    it('should reuse the initialization promise when called twice', async () => {
      // Arrange
      userState.set({ uid: 'user-1' });
      firestoreMocks.getDocs.mockImplementation(async () => createSnapshot([]));

      // Act
      const service = await createService();
      TestBed.flushEffects();
      const first = service.initialize();
      const second = service.initialize();
      await first;
      await second;

      // Assert
      expect(initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('given local writes without a signed in user', () => {
    it('should mutate the in-memory collections without syncing to Firestore', async () => {
      // Assemble
      const service = await createService();
      await service.whenReady();

      // Act
      const createdId = service.createDocument(GLOBAL_COLLECTIONS.recipes, {
        name: 'Tea',
        servings: 1,
        image: '',
        ingredients: {},
      }, 'global');
      service.upsertDocument(GLOBAL_COLLECTIONS.recipes, 'manual', {
        name: 'Manual',
        servings: 3,
        image: '',
        ingredients: { water: 1 },
      }, 'global');
      service.deleteDocument(GLOBAL_COLLECTIONS.recipes, 'missing', 'global');
      service.deleteDocument(GLOBAL_COLLECTIONS.recipes, createdId, 'global');

      // Assert
      expect(service.hasCollection(GLOBAL_COLLECTIONS.recipes, 'global')).toBe(true);
      expect(service.hasDocument(GLOBAL_COLLECTIONS.recipes, 'manual', 'global')).toBe(true);
      expect(service.hasDocument(GLOBAL_COLLECTIONS.recipes, createdId, 'global')).toBe(false);
      expect(service.readDocument(GLOBAL_COLLECTIONS.recipes, 'manual', { id: 'fallback' }, 'global')).toEqual(
        {
          name: 'Manual',
          servings: 3,
          image: '',
          ingredients: { water: 1 },
        },
      );
      expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
      expect(firestoreMocks.deleteDoc).not.toHaveBeenCalled();
    });
  });

  describe('given a signed in user and collection sync', () => {
    it('should sync created, replaced, and deleted documents to Firestore', async () => {
      userState.set({ uid: 'user-1' });
      firestoreMocks.getDocs.mockImplementation(async () => createSnapshot([]));

      // Assemble
      const service = await createService();
      await service.whenReady();

      // Act
      const createdId = service.createDocument(GLOBAL_COLLECTIONS.recipes, {
        name: 'Soup',
        servings: 2,
        image: '',
        ingredients: { tomato: 2 },
      });
      service.deleteDocument(GLOBAL_COLLECTIONS.recipes, createdId);
      const replaced = service.replaceCollection(
        USER_COLLECTIONS.recipes,
        [
          {
            name: 'Breakfast',
            servings: 1,
            image: '',
            ingredients: { egg: 2 },
          },
          {
            name: 'Lunch',
            servings: 2,
            image: '',
            ingredients: { salad: 1 },
          },
        ],
        'user',
      );
      service.replaceCollection(
        USER_COLLECTIONS.recipes,
        [
          {
            name: 'Breakfast',
            servings: 1,
            image: '',
            ingredients: { egg: 2 },
          },
        ],
        'user',
      );

      // Assert
      expect(replaced).toHaveLength(2);
      expect(firestoreMocks.setDoc).toHaveBeenCalled();
      expect(firestoreMocks.deleteDoc).toHaveBeenCalled();
      expect(
        firestoreMocks.collection.mock.calls.some(
          (call) =>
            call[1] === 'users' &&
            call[2] === 'user-1' &&
            call[3] === USER_COLLECTIONS.recipes,
        ),
      ).toBe(true);
    });
  });

  describe('given a load failure', () => {
    it('should clear state and keep working', async () => {
      userState.set({ uid: 'user-1' });
      firestoreMocks.getDocs.mockRejectedValue(new Error('boom'));

      // Assemble
      const service = await createService();

      // Act
      TestBed.flushEffects();
      await service.whenReady();

      // Assert
      expect(service.collectionSize('recipes')).toBe(0);
      expect(service.hasCollection('recipes')).toBe(false);
    });
  });
});

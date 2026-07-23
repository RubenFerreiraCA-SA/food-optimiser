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
  });

  describe('given auth changes after construction', () => {
    it('should reload data when the user signal changes', async () => {
      // Assemble
      firestoreMocks.getDocs.mockImplementation(async (ref: { path: string[] }) => {
        const key = ref.path.join('/');
        if (key === 'users/user-1/profile') {
          return createSnapshot([
            {
              id: 'main',
              data: {
                uid: 'user-1',
                displayName: 'Ruben',
              },
            },
          ]);
        }
        return createSnapshot([]);
      });

      const service = await createService();

      // Act
      userState.set({ uid: 'user-1' });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await service.initialize();

      // Assert
      expect(service.readDocument('profile', 'main', { uid: 'fallback' })).toEqual(
        expect.objectContaining({
          uid: 'user-1',
          displayName: 'Ruben',
        }),
      );
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

  describe('given signed in global writes', () => {
    it('should use the global collection references', async () => {
      // Assemble
      userState.set({ uid: 'user-1' });
      firestoreMocks.getDocs.mockImplementation(async () => createSnapshot([]));
      const service = await createService();
      await service.whenReady();

      // Act
      const createdId = service.createDocument(
        GLOBAL_COLLECTIONS.recipes,
        {
          name: 'Tea',
          servings: 1,
          image: '',
          ingredients: {},
        },
        'global',
      );
      service.upsertDocument(
        GLOBAL_COLLECTIONS.recipes,
        createdId,
        {
          name: 'Updated tea',
          servings: 2,
          image: '',
          ingredients: {},
        },
        'global',
      );
      service.deleteDocument(GLOBAL_COLLECTIONS.recipes, createdId, 'global');

      // Assert
      expect(
        firestoreMocks.collection.mock.calls.some(
          (call) => call.length === 2 && call[1] === GLOBAL_COLLECTIONS.recipes,
        ),
      ).toBe(true);
      expect(firestoreMocks.setDoc).toHaveBeenCalled();
      expect(firestoreMocks.deleteDoc).toHaveBeenCalled();
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

  describe('given Firestore write failures', () => {
    it('should log and keep local changes when writes fail', async () => {
      // Assemble
      userState.set({ uid: 'user-1' });
      firestoreMocks.getDocs.mockImplementation(async () => createSnapshot([]));
      firestoreMocks.setDoc.mockRejectedValueOnce(new Error('set failed'));
      firestoreMocks.deleteDoc.mockRejectedValueOnce(new Error('delete failed'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const service = await createService();
      await service.whenReady();

      // Act
      const createdId = service.createDocument(USER_COLLECTIONS.recipes, {
        name: 'Soup',
        servings: 2,
        image: '',
        ingredients: { tomato: 2 },
      });
      service.deleteDocument(USER_COLLECTIONS.recipes, createdId);
      await Promise.resolve();

      firestoreMocks.setDoc.mockRejectedValueOnce(new Error('sync set failed'));
      service.replaceCollection(
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
      );
      await Promise.resolve();

      firestoreMocks.deleteDoc.mockRejectedValueOnce(new Error('sync delete failed'));
      firestoreMocks.deleteDoc.mockRejectedValueOnce(new Error('sync delete failed'));
      const retainedIds = service.replaceCollection(USER_COLLECTIONS.recipes, [
        {
          name: 'Dinner',
          servings: 3,
          image: '',
          ingredients: { rice: 1 },
        },
      ]);
      await Promise.resolve();

      firestoreMocks.collection.mockImplementationOnce(() => {
        throw new Error('collection failed');
      });
      service.replaceCollection(USER_COLLECTIONS.recipes, retainedIds);
      await Promise.resolve();

      // Assert
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to write Firestore document:',
        expect.objectContaining({
          uid: 'user-1',
          collectionName: USER_COLLECTIONS.recipes,
          docId: createdId,
        }),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to delete Firestore document:',
        expect.objectContaining({
          uid: 'user-1',
          collectionName: USER_COLLECTIONS.recipes,
          docId: createdId,
        }),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to delete Firestore document:',
        expect.objectContaining({
          uid: 'user-1',
          collectionName: USER_COLLECTIONS.recipes,
        }),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to replace Firestore collection:',
        expect.objectContaining({
          uid: 'user-1',
          collectionName: USER_COLLECTIONS.recipes,
        }),
      );
      errorSpy.mockRestore();
    });
  });

  describe('given a sync collection delete failure', () => {
    it('should log delete errors from the collection sync helper', async () => {
      // Assemble
      firestoreMocks.getDocs.mockImplementation(async () => createSnapshot([]));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const service = await createService();
      await service.whenReady();
      firestoreMocks.deleteDoc.mockRejectedValueOnce(new Error('sync delete failed'));
      const serviceMethods = service as unknown as {
        syncCollection(
          this: DataService,
          uid: string,
          collectionName: string,
          items: Array<{ id: string; name: string }>,
          current: Record<string, { name: string }>,
          scope: 'user' | 'global',
        ): Promise<void>;
      };

      // Act
      await serviceMethods.syncCollection.call(
        service,
        'user-1',
        USER_COLLECTIONS.recipes,
        [
          {
            id: 'keep',
            name: 'Keep',
          },
        ],
        {
          removed: {
            name: 'Removed',
          },
        },
        'user',
      );

      // Assert
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to delete Firestore document:',
        expect.objectContaining({
          uid: 'user-1',
          collectionName: USER_COLLECTIONS.recipes,
          docId: 'removed',
        }),
      );
      errorSpy.mockRestore();
    });
  });

  describe('given a load failure', () => {
    it('should clear state and keep working', async () => {
      firestoreMocks.getDocs.mockRejectedValue(new Error('boom'));

      // Assemble
      const service = await createService();

      // Act
      const serviceMethods = service as unknown as {
        loadForUser(this: DataService, uid: string | null): Promise<void>;
      };
      await serviceMethods.loadForUser.call(service, 'user-1');

      // Assert
      expect(service.collectionSize('recipes')).toBe(0);
      expect(service.hasCollection('recipes')).toBe(false);
    });
  });

  describe('given a stale load and a null auth state', () => {
    it('should ignore outdated loads and clear data for anonymous users', async () => {
      // Assemble
      firestoreMocks.getDocs.mockResolvedValue(createSnapshot([]));
      const service = await createService();

      // Act
      const serviceMethods = service as unknown as {
        loadForUser(this: DataService, uid: string | null): Promise<void>;
      };
      const staleLoad = serviceMethods.loadForUser.call(service, 'user-1');
      const clearLoad = serviceMethods.loadForUser.call(service, null);
      await Promise.all([clearLoad, staleLoad]);

      // Assert
      expect(service.collectionSize('recipes')).toBe(0);
      expect(service.hasCollection('recipes')).toBe(false);
    });
  });
});

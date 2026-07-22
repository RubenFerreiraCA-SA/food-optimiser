import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { DataService } from './data.service';
import { GLOBAL_COLLECTIONS } from './user-data';

describe('DataService', () => {
  it('uses Firestore-style ids for created and replaced documents', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            initialize: () => Promise.resolve(),
            user: () => null,
          },
        },
      ],
    });
    const service = TestBed.inject(DataService);

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
    expect(createdId).toMatch(/^[0-9a-f]{8}$/);

    const replaced = service.replaceCollection(
      GLOBAL_COLLECTIONS.recipes,
      [
      {
        id: 'saved',
        name: 'Soup',
        servings: 2,
        image: '',
        ingredients: { water: 1 },
      },
      ],
      'global',
    );
    expect(replaced[0].id).toMatch(/^[0-9a-f]{8}$/);
    expect(service.readCollection(GLOBAL_COLLECTIONS.recipes, [], 'global')).toEqual([
      {
        id: replaced[0].id,
        name: 'Soup',
        servings: 2,
        image: '',
        ingredients: { water: 1 },
      },
    ]);
    expect(service.collectionSize(GLOBAL_COLLECTIONS.recipes, 'global')).toBe(1);

    service.deleteDocument(GLOBAL_COLLECTIONS.recipes, replaced[0].id, 'global');
    expect(service.readCollection(GLOBAL_COLLECTIONS.recipes, [], 'global')).toEqual([]);
  });
});

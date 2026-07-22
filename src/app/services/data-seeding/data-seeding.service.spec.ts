import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { DATA_ADAPTER, DataAdapter } from '../data/data.service';
import { DataSeedingService } from './data-seeding.service';
import { DATA_KEYS } from './seed-data';

describe('SeedService', () => {
  it('seeds missing records without replacing existing data', async () => {
    const values = new Map<string, string>([[DATA_KEYS.menu, JSON.stringify([{ id: 'saved' }])]]);
    const adapter: DataAdapter = {
      read: (key) => values.get(key) ?? null,
      write: (key, value) => values.set(key, value),
      remove: (key) => values.delete(key),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: DATA_ADAPTER, useValue: adapter },
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

    expect(JSON.parse(values.get(DATA_KEYS.menu) ?? '[]')).toEqual([{ id: 'saved' }]);
    expect(JSON.parse(values.get(DATA_KEYS.pantry) ?? '[]')).toHaveLength(7);
  });
});

import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { DataService } from '../data/data.service';
import { DataSeedingService } from './data-seeding.service';
import { DATA_KEYS } from './seed-data';

describe('SeedService', () => {
  it('seeds missing records without replacing existing data', async () => {
    const values = new Map<string, string>([[DATA_KEYS.menu, JSON.stringify([{ id: 'saved' }])]]);
    const data = {
      has: (key: string) => values.has(key),
      read: (key: string, fallback: unknown) => {
        const value = values.get(key);
        return value ? JSON.parse(value) : fallback;
      },
      write: (key: string, value: unknown) => values.set(key, JSON.stringify(value)),
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

    expect(JSON.parse(values.get(DATA_KEYS.menu) ?? '[]')).toEqual([{ id: 'saved' }]);
    expect(JSON.parse(values.get(DATA_KEYS.pantry) ?? '[]')).toHaveLength(7);
  });
});

import { TestBed } from '@angular/core/testing';
import { DATA_KEYS } from '../../data/default-data';
import { DATA_ADAPTER, DataAdapter } from '../data/data.service';
import { SeedService } from './seed.service';

describe('SeedService', () => {
  it('seeds missing records without replacing existing data', () => {
    const values = new Map<string, string>([[DATA_KEYS.menu, JSON.stringify([{ id: 'saved' }])]]);
    const adapter: DataAdapter = {
      read: (key) => values.get(key) ?? null,
      write: (key, value) => values.set(key, value),
      remove: (key) => values.delete(key),
    };
    TestBed.configureTestingModule({ providers: [{ provide: DATA_ADAPTER, useValue: adapter }] });

    TestBed.inject(SeedService).seed();

    expect(JSON.parse(values.get(DATA_KEYS.menu) ?? '[]')).toEqual([{ id: 'saved' }]);
    expect(JSON.parse(values.get(DATA_KEYS.pantry) ?? '[]')).toHaveLength(7);
  });
});

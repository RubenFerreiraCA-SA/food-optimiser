import { TestBed } from '@angular/core/testing';
import { DATA_ADAPTER, DataAdapter, DataService } from './data.service';

describe('DataService', () => {
  it('serialises values through the configured adapter and falls back when data is invalid', () => {
    const values = new Map<string, string>();
    const adapter: DataAdapter = {
      read: (key) => values.get(key) ?? null,
      write: (key, value) => values.set(key, value),
      remove: (key) => values.delete(key),
    };
    TestBed.configureTestingModule({ providers: [{ provide: DATA_ADAPTER, useValue: adapter }] });
    const service = TestBed.inject(DataService);

    service.write('plan', { meals: 6 });
    expect(service.read('plan', { meals: 0 })).toEqual({ meals: 6 });

    values.set('plan', 'not json');
    expect(service.read('plan', { meals: 0 })).toEqual({ meals: 0 });
  });
});

import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { DataService } from './data.service';

describe('DataService', () => {
  it('serialises values and falls back when data is invalid', () => {
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

    service.write('plan', { meals: 6 });
    expect(service.read('plan', { meals: 0 })).toEqual({ meals: 6 });

    service.write('plan', 'not json');
    expect(service.read('plan', { meals: 0 })).toEqual('not json');
  });
});

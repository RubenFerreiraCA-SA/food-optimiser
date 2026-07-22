import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { DataSeedingService } from './shared/services/data-seeding/data-seeding.service';
import { DATA_ADAPTER, DataService } from './shared/services/data/data.service';
import { FirebaseDataAdapter } from './shared/services/data/firebase-data-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: DATA_ADAPTER, useFactory: () => new FirebaseDataAdapter() },
    provideAppInitializer(() => {
      const data = inject(DataService);
      const seeding = inject(DataSeedingService);

      void data.initialize();
      seeding.seed();
    }),
  ],
};

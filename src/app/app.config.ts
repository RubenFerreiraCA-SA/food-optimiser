import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './services/auth/auth.service';
import { DataSeedingService } from './services/data-seeding/data-seeding.service';
import { DATA_ADAPTER, DataService } from './services/data/data.service';
import { FirebaseDataAdapter } from './services/data/firebase-data-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: DATA_ADAPTER, useFactory: () => new FirebaseDataAdapter() },
    provideAppInitializer(() => {
      void inject(AuthService).initialize();
      const data = inject(DataService);
      const seeding = inject(DataSeedingService);

      void data.initialize();
      seeding.seed();
    }),
  ],
};

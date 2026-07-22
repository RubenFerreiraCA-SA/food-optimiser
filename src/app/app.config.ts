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
    { provide: DATA_ADAPTER, useExisting: FirebaseDataAdapter },
    provideAppInitializer(async () => {
      const auth = inject(AuthService);
      const data = inject(DataService);
      const seeding = inject(DataSeedingService);

      await auth.initialize();
      await data.initialize();
      await seeding.seed();
    }),
  ],
};

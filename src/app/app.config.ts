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
import { DataService } from './services/data/data.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
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

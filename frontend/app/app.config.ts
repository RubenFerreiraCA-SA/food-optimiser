import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { apiAuthInterceptor } from './services/core/api/api-auth.interceptor';
import { AuthService } from './services/core/auth/auth.service';
import { DataSeedingService } from './services/seed/data-seeding.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([apiAuthInterceptor])),
    provideRouter(routes),
    provideAppInitializer(async () => {
      const auth = inject(AuthService);
      const seeding = inject(DataSeedingService);
      await auth.initialize();
      await seeding.seed();
    }),
  ],
};

import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { DATA_KEYS, defaultIngredients, defaultRecipes } from './seed-data';
import { DataService } from '../data.service';

@Injectable({ providedIn: 'root' })
export class DataSeedingService {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!this.auth.ready() || !user) return;
      void this.seed();
    });
  }

  async seed(): Promise<void> {
    if (!this.auth.isAuthenticated()) return;

    await this.data.whenReady();

    if (!this.data.has(DATA_KEYS.pantry)) this.data.write(DATA_KEYS.pantry, defaultIngredients());
    if (!this.data.has(DATA_KEYS.menu)) this.data.write(DATA_KEYS.menu, defaultRecipes());
  }
}

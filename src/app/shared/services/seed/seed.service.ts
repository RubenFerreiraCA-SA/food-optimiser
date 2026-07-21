import { Injectable, inject } from '@angular/core';
import { DATA_KEYS, defaultIngredients, defaultRecipes } from './default-data';
import { DataService } from '../data/data.service';

@Injectable({ providedIn: 'root' })
export class SeedService {
  private readonly data = inject(DataService);

  seed(): void {
    if (!this.data.has(DATA_KEYS.pantry)) this.data.write(DATA_KEYS.pantry, defaultIngredients());
    if (!this.data.has(DATA_KEYS.menu)) this.data.write(DATA_KEYS.menu, defaultRecipes());
  }
}

import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { DataService } from './data.service';
import { GLOBAL_COLLECTIONS } from './user-data';
import { defaultIngredients } from './data-seeding/seed-data';
import { SharedIngredient } from './shared-types';

@Injectable({ providedIn: 'root' })
export class IngredientCatalogService {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);
  private readonly state = signal<SharedIngredient[]>(this.read());
  readonly ingredients = computed(() => this.state());

  constructor() {
    effect(() => {
      this.data.revision();
      if (!this.auth.ready()) return;
      this.auth.user();
      void this.refresh();
    });
  }

  find(id: string): SharedIngredient | undefined {
    return this.state().find((ingredient) => ingredient.id === id);
  }

  nameFor(id: string): string {
    return this.find(id)?.name ?? id;
  }

  imageFor(id: string): string {
    return this.find(id)?.image ?? '';
  }

  private read(): SharedIngredient[] {
    return this.data.readCollection(GLOBAL_COLLECTIONS.ingredients, defaultIngredients(), 'global');
  }

  private async refresh(): Promise<void> {
    await this.data.whenReady();
    this.state.set(this.read());
  }
}

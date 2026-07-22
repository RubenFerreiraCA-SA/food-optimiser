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

  findByName(name: string): SharedIngredient | undefined {
    const needle = this.normalize(name);
    if (!needle) return undefined;
    return this.state().find((ingredient) => this.normalize(ingredient.name) === needle);
  }

  search(query: string): SharedIngredient[] {
    const needle = this.normalize(query);
    if (needle.length < 3) return [];
    return this.state()
      .filter((ingredient) => this.normalize(ingredient.name).startsWith(needle))
      .slice(0, 8);
  }

  add(name: string): SharedIngredient | null {
    const cleanName = name.trim();
    if (!cleanName) return null;
    const existing = this.findByName(cleanName);
    if (existing) return existing;

    const ingredient = {
      id: this.data.createDocument(GLOBAL_COLLECTIONS.ingredients, {
        name: cleanName,
        image: '',
      }, 'global'),
      name: cleanName,
      image: '',
    };
    this.state.set([...this.state(), ingredient]);
    return ingredient;
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

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private async refresh(): Promise<void> {
    await this.data.whenReady();
    this.state.set(this.read());
  }
}

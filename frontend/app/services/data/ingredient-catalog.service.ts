import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ApiClientService } from '../api/api-client.service';
import { SharedIngredient } from './shared-types';

@Injectable({ providedIn: 'root' })
export class IngredientCatalogService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiClientService);
  private readonly state = signal<SharedIngredient[]>([]);
  readonly ingredients = computed(() => this.state());

  constructor() {
    effect(() => {
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

  async add(name: string): Promise<SharedIngredient | null> {
    const cleanName = name.trim();
    if (!cleanName) return null;
    const existing = this.findByName(cleanName);
    if (existing) return existing;

    const ingredient = await this.api.createIngredient({ name: cleanName, image: '' });
    this.state.update((items) => this.sortIngredients([...items, ingredient]));
    return ingredient;
  }

  nameFor(id: string): string {
    return this.find(id)?.name ?? id;
  }

  imageFor(id: string): string {
    return this.find(id)?.image ?? '';
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private async refresh(): Promise<void> {
    try {
      const ingredients = await this.api.getIngredients();
      this.state.set(this.sortIngredients(ingredients));
    } catch (error) {
      console.error('Failed to load ingredient catalog from API:', error);
    }
  }

  private sortIngredients(ingredients: SharedIngredient[]): SharedIngredient[] {
    return [...ingredients].sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
    );
  }
}

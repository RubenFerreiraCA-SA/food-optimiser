import { Injectable, computed, inject, signal } from '@angular/core';
import { DataService } from '../data/data.service';
import { DATA_KEYS, defaultIngredients } from '../../data/default-data';

export interface PantryIngredient {
  id: string;
  name: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class PantryService {
  private readonly data = inject(DataService);
  private readonly storageKey = DATA_KEYS.pantry;
  private readonly state = signal<PantryIngredient[]>(this.read());
  readonly ingredients = computed(() => this.state());

  add(name: string, quantity: number): boolean {
    const cleanName = name.trim();
    if (
      !cleanName ||
      quantity < 1 ||
      this.state().some((item) => item.name.toLowerCase() === cleanName.toLowerCase())
    )
      return false;
    this.update([...this.state(), { id: crypto.randomUUID(), name: cleanName, quantity }]);
    return true;
  }
  remove(id: string): void {
    this.update(this.state().filter((item) => item.id !== id));
  }
  setQuantity(id: string, quantity: number): boolean {
    if (!Number.isInteger(quantity) || quantity < 0 || !this.state().some((item) => item.id === id))
      return false;
    this.update(this.state().map((item) => (item.id === id ? { ...item, quantity } : item)));
    return true;
  }
  reset(): void {
    this.update(defaultIngredients());
  }

  private read(): PantryIngredient[] {
    return this.data.read(this.storageKey, defaultIngredients());
  }
  private update(ingredients: PantryIngredient[]): void {
    this.state.set(ingredients);
    this.data.write(this.storageKey, ingredients);
  }
}

import { Injectable, computed, signal } from '@angular/core';

export interface PantryIngredient {
  id: string;
  name: string;
  quantity: number;
}

const DEFAULT_INGREDIENTS: PantryIngredient[] = [
  { id: 'cucumber', name: 'Cucumber', quantity: 2 },
  { id: 'olives', name: 'Olives', quantity: 2 },
  { id: 'lettuce', name: 'Lettuce', quantity: 3 },
  { id: 'meat', name: 'Meat', quantity: 6 },
  { id: 'tomato', name: 'Tomato', quantity: 6 },
  { id: 'cheese', name: 'Cheese', quantity: 8 },
  { id: 'dough', name: 'Dough', quantity: 10 },
];

@Injectable({ providedIn: 'root' })
export class PantryService {
  private readonly storageKey = 'make-the-most-pantry';
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
    this.update(DEFAULT_INGREDIENTS.map((item) => ({ ...item })));
  }

  private read(): PantryIngredient[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : DEFAULT_INGREDIENTS;
    } catch {
      return DEFAULT_INGREDIENTS;
    }
  }
  private update(ingredients: PantryIngredient[]): void {
    this.state.set(ingredients);
    localStorage.setItem(this.storageKey, JSON.stringify(ingredients));
  }
}

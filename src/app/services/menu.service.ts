import { Injectable, computed, signal } from '@angular/core';

export interface RecipeIngredient {
  name: string;
  quantity: number;
}
export interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: RecipeIngredient[];
}

const DEFAULT_RECIPES: Recipe[] = [
  {
    id: 'burger',
    name: 'Burger',
    servings: 1,
    ingredients: [
      { name: 'Meat', quantity: 1 },
      { name: 'Lettuce', quantity: 1 },
      { name: 'Tomato', quantity: 1 },
      { name: 'Cheese', quantity: 1 },
      { name: 'Dough', quantity: 1 },
    ],
  },
  {
    id: 'pie',
    name: 'Pie',
    servings: 1,
    ingredients: [
      { name: 'Dough', quantity: 2 },
      { name: 'Meat', quantity: 2 },
    ],
  },
  {
    id: 'sandwich',
    name: 'Sandwich',
    servings: 1,
    ingredients: [
      { name: 'Dough', quantity: 1 },
      { name: 'Cucumber', quantity: 1 },
    ],
  },
  {
    id: 'pasta',
    name: 'Pasta',
    servings: 2,
    ingredients: [
      { name: 'Dough', quantity: 2 },
      { name: 'Tomato', quantity: 1 },
      { name: 'Cheese', quantity: 2 },
      { name: 'Meat', quantity: 1 },
    ],
  },
  {
    id: 'salad',
    name: 'Salad',
    servings: 3,
    ingredients: [
      { name: 'Lettuce', quantity: 2 },
      { name: 'Tomato', quantity: 2 },
      { name: 'Cucumber', quantity: 1 },
      { name: 'Cheese', quantity: 2 },
      { name: 'Olives', quantity: 1 },
    ],
  },
  {
    id: 'pizza',
    name: 'Pizza',
    servings: 4,
    ingredients: [
      { name: 'Dough', quantity: 3 },
      { name: 'Tomato', quantity: 2 },
      { name: 'Cheese', quantity: 3 },
      { name: 'Olives', quantity: 1 },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly storageKey = 'make-the-most-menu';
  private readonly recipeState = signal<Recipe[]>(this.readRecipes());
  readonly recipes = computed(() => this.recipeState());

  add(recipe: Omit<Recipe, 'id'>): void {
    this.update([...this.recipeState(), { ...recipe, id: crypto.randomUUID() }]);
  }

  find(id: string): Recipe | undefined {
    return this.recipeState().find((recipe) => recipe.id === id);
  }

  updateRecipe(id: string, recipe: Omit<Recipe, 'id'>): void {
    this.update(
      this.recipeState().map((current) => (current.id === id ? { ...recipe, id } : current)),
    );
  }

  remove(id: string): void {
    this.update(this.recipeState().filter((recipe) => recipe.id !== id));
  }
  
  reset(): void {
    this.update(
      DEFAULT_RECIPES.map((recipe) => ({ ...recipe, ingredients: [...recipe.ingredients] })),
    );
  }

  private readRecipes(): Recipe[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : DEFAULT_RECIPES;
    } catch {
      return DEFAULT_RECIPES;
    }
  }
  private update(recipes: Recipe[]): void {
    this.recipeState.set(recipes);
    localStorage.setItem(this.storageKey, JSON.stringify(recipes));
  }
}

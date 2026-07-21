import type { Recipe } from '../services/menu/menu.service';
import type { PantryIngredient } from '../services/pantry/pantry.service';

export const DATA_KEYS = {
  menu: 'make-the-most-menu',
  pantry: 'make-the-most-pantry',
} as const;

export const DEFAULT_INGREDIENTS: PantryIngredient[] = [
  { id: 'cucumber', name: 'Cucumber', quantity: 2 },
  { id: 'olives', name: 'Olives', quantity: 2 },
  { id: 'lettuce', name: 'Lettuce', quantity: 3 },
  { id: 'meat', name: 'Meat', quantity: 6 },
  { id: 'tomato', name: 'Tomato', quantity: 6 },
  { id: 'cheese', name: 'Cheese', quantity: 8 },
  { id: 'dough', name: 'Dough', quantity: 10 },
];

export const DEFAULT_RECIPES: Recipe[] = [
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

export function defaultIngredients(): PantryIngredient[] {
  return DEFAULT_INGREDIENTS.map((ingredient) => ({ ...ingredient }));
}
export function defaultRecipes(): Recipe[] {
  return DEFAULT_RECIPES.map((recipe) => ({
    ...recipe,
    ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient })),
  }));
}

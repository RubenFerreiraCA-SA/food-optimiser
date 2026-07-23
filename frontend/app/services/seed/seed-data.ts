import { Recipe, SharedIngredient } from '../domain/models';

export interface PantrySeedIngredient {
  id: string;
  name: string;
  image: string;
  quantity: number;
}

export const DEFAULT_INGREDIENTS: SharedIngredient[] = [
  { id: 'cucumber', name: 'Cucumber', image: '' },
  { id: 'olives', name: 'Olives', image: '' },
  { id: 'lettuce', name: 'Lettuce', image: '' },
  { id: 'meat', name: 'Meat', image: '' },
  { id: 'tomato', name: 'Tomato', image: '' },
  { id: 'cheese', name: 'Cheese', image: '' },
  { id: 'dough', name: 'Dough', image: '' },
];

const INGREDIENT_HASHES = {
  cucumber: shortHash('cucumber'),
  olives: shortHash('olives'),
  lettuce: shortHash('lettuce'),
  meat: shortHash('meat'),
  tomato: shortHash('tomato'),
  cheese: shortHash('cheese'),
  dough: shortHash('dough'),
} as const;

export const DEFAULT_PANTRY: PantrySeedIngredient[] = [
  { id: 'cucumber', name: 'Cucumber', image: '', quantity: 2 },
  { id: 'olives', name: 'Olives', image: '', quantity: 2 },
  { id: 'lettuce', name: 'Lettuce', image: '', quantity: 3 },
  { id: 'meat', name: 'Meat', image: '', quantity: 6 },
  { id: 'tomato', name: 'Tomato', image: '', quantity: 6 },
  { id: 'cheese', name: 'Cheese', image: '', quantity: 8 },
  { id: 'dough', name: 'Dough', image: '', quantity: 10 },
];

export const DEFAULT_RECIPES: Recipe[] = [
  {
    id: 'burger',
    name: 'Burger',
    servings: 1,
    image: '',
    ingredients: {
      [INGREDIENT_HASHES.meat]: 1,
      [INGREDIENT_HASHES.lettuce]: 1,
      [INGREDIENT_HASHES.tomato]: 1,
      [INGREDIENT_HASHES.cheese]: 1,
      [INGREDIENT_HASHES.dough]: 1,
    },
  },
  {
    id: 'pie',
    name: 'Pie',
    servings: 1,
    image: '',
    ingredients: {
      [INGREDIENT_HASHES.dough]: 2,
      [INGREDIENT_HASHES.meat]: 2,
    },
  },
  {
    id: 'sandwich',
    name: 'Sandwich',
    servings: 1,
    image: '',
    ingredients: {
      [INGREDIENT_HASHES.dough]: 1,
      [INGREDIENT_HASHES.cucumber]: 1,
    },
  },
  {
    id: 'pasta',
    name: 'Pasta',
    servings: 2,
    image: '',
    ingredients: {
      [INGREDIENT_HASHES.dough]: 2,
      [INGREDIENT_HASHES.tomato]: 1,
      [INGREDIENT_HASHES.cheese]: 2,
      [INGREDIENT_HASHES.meat]: 1,
    },
  },
  {
    id: 'salad',
    name: 'Salad',
    servings: 3,
    image: '',
    ingredients: {
      [INGREDIENT_HASHES.lettuce]: 2,
      [INGREDIENT_HASHES.tomato]: 2,
      [INGREDIENT_HASHES.cucumber]: 1,
      [INGREDIENT_HASHES.cheese]: 2,
      [INGREDIENT_HASHES.olives]: 1,
    },
  },
  {
    id: 'pizza',
    name: 'Pizza',
    servings: 4,
    image: '',
    ingredients: {
      [INGREDIENT_HASHES.dough]: 3,
      [INGREDIENT_HASHES.tomato]: 2,
      [INGREDIENT_HASHES.cheese]: 3,
      [INGREDIENT_HASHES.olives]: 1,
    },
  },
];

export function defaultIngredients(): SharedIngredient[] {
  return DEFAULT_INGREDIENTS.map((ingredient) => ({ ...ingredient, id: shortHash(ingredient.id) }));
}

export function defaultPantryIngredients(): PantrySeedIngredient[] {
  return DEFAULT_PANTRY.map((ingredient) => ({ ...ingredient, id: shortHash(ingredient.id) }));
}

export function defaultRecipes(): Recipe[] {
  return DEFAULT_RECIPES.map((recipe) => ({
    ...recipe,
    id: shortHash(recipe.id),
    ingredients: { ...recipe.ingredients },
  }));
}

export function shortHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 8);
}

export interface SharedIngredient {
  id: string;
  name: string;
  image: string;
}

export type RecipeIngredientMap = Record<string, number>;

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  image: string;
  ingredients: RecipeIngredientMap;
  origin?: 'shared' | 'forked' | 'custom';
  sourceRecipeId?: string;
}

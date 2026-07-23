import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { IngredientCatalogService } from '../../../services/domain/ingredients/ingredient-catalog.service';
import { Recipe } from '../../../services/domain/models';

export type RecipeCardMode = 'view' | 'select';

export interface RecipeCardAction {
  id: string;
  label: string;
  variant?: 'default' | 'remove';
}

export interface RecipeCardConfig {
  recipe: Recipe;
  mode: RecipeCardMode;
  selected?: boolean;
  actions?: RecipeCardAction[];
}

export interface RecipeCardEvent {
  action: string;
  recipe: Recipe;
}

@Component({
  selector: 'app-recipe-card',
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.scss',
})
export class RecipeCard {
  @Input({ required: true }) config!: RecipeCardConfig;
  @Output() readonly action = new EventEmitter<RecipeCardEvent>();
  private readonly ingredients = inject(IngredientCatalogService);

  recipeIngredients(recipe: Recipe): Array<{ id: string; name: string; quantity: number }> {
    return Object.entries(recipe.ingredients).map(([id, quantity]) => ({
      id,
      name: this.ingredients.nameFor(id),
      quantity,
    }));
  }

  mockImageLabel(): string {
    const labels: Record<string, string> = {
      burger: '🍔',
      pie: '🥧',
      sandwich: '🥪',
      pasta: '🍝',
      salad: '🥗',
      pizza: '🍕',
    };
    return labels[this.config.recipe.id] ?? '🍽️';
  }

  recipeBadgeLabel(): string | null {
    const recipe = this.config.recipe;
    if (recipe.origin === 'shared') return 'Original';
    if (recipe.origin === 'forked') return 'Forked';
    if (recipe.origin === 'custom') return 'Custom';
    return null;
  }
}

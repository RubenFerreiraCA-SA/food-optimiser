import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Recipe } from '../../../services/menu/menu.service';

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
}

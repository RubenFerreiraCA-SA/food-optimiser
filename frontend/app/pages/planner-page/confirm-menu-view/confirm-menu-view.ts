import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  RecipeCard,
  RecipeCardConfig,
  RecipeCardEvent,
} from '../../../shared/components/recipe-card/recipe-card';
import { Recipe } from '../../../services/data/shared-types';

@Component({
  selector: 'app-confirm-menu-view',
  imports: [RecipeCard, RouterLink],
  templateUrl: './confirm-menu-view.html',
  styleUrl: './confirm-menu-view.scss',
})
export class ConfirmMenuView {
  @Input({ required: true }) recipes: Recipe[] = [];
  @Input({ required: true }) selectedRecipeIds: string[] = [];
  @Output() readonly selectionChange = new EventEmitter<string>();
  @Output() readonly back = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<void>();

  isSelected(id: string): boolean {
    return this.selectedRecipeIds.includes(id);
  }
  recipeCard(recipe: Recipe): RecipeCardConfig {
    return { recipe, mode: 'select', selected: this.isSelected(recipe.id) };
  }
  handleRecipeCard(event: RecipeCardEvent): void {
    this.selectionChange.emit(event.recipe.id);
  }
}

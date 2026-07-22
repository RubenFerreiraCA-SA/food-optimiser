import { Component, computed, inject, signal } from '@angular/core';
import { Dialog, DialogConfig } from '../../shared/components/dialog/dialog';
import { NewRecipeView } from './new-recipe-view/new-recipe-view';
import { PageHero, PageHeroConfig } from '../../shared/components/page-hero/page-hero';
import {
  RecipeCard,
  RecipeCardConfig,
  RecipeCardEvent,
} from '../../shared/components/recipe-card/recipe-card';
import { MenuService } from '../../services/page-helpers/menu/menu.service';
import { Recipe } from '../../services/data/shared-types';

@Component({
  selector: 'app-menu-page',
  imports: [NewRecipeView, Dialog, PageHero, RecipeCard],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.scss',
})
export class MenuPage {
  readonly menu = inject(MenuService);
  readonly recipeToRemove = signal<Recipe | null>(null);
  readonly recipeBeingEdited = signal<Recipe | null>(null);
  readonly isCreatingRecipe = signal(false);
  readonly isRecipeFormOpen = computed(() => this.isCreatingRecipe() || !!this.recipeBeingEdited());
  readonly hero: PageHeroConfig = {
    eyebrow: 'Your recipe collection',
    title: "What's on the menu?",
    description: 'Keep the meals you can make in one place, ready for your next plan.',
    titleId: 'menu-title',
    mark: '🍽️',
    markRotation: -12,
  };
  recipeCard(recipe: Recipe): RecipeCardConfig {
    return {
      recipe,
      mode: 'view',
      actions: [
        { id: 'edit', label: 'Edit recipe' },
        { id: 'remove', label: 'Remove', variant: 'remove' },
      ],
    };
  }
  handleRecipeCard(event: RecipeCardEvent): void {
    event.action === 'edit' ? this.startEditing(event.recipe) : this.requestRemoval(event.recipe);
  }
  requestRemoval(recipe: Recipe): void {
    this.recipeToRemove.set(recipe);
  }
  cancelRemoval(): void {
    this.recipeToRemove.set(null);
  }
  confirmRemoval(): void {
    const recipe = this.recipeToRemove();
    if (recipe) this.menu.remove(recipe.id);
    this.recipeToRemove.set(null);
  }
  removeDialog(recipe: Recipe): DialogConfig {
    return {
      eyebrow: 'Remove recipe',
      title: `Remove ${recipe.name}?`,
      description:
        'This will remove it from your available menu. You can restore it later by resetting the menu.',
      actions: [
        { id: 'cancel', label: 'Keep recipe', variant: 'secondary' },
        { id: 'confirm', label: 'Remove recipe', variant: 'danger' },
      ],
    };
  }
  handleRemoveDialog(action: string): void {
    action === 'confirm' ? this.confirmRemoval() : this.cancelRemoval();
  }
  startCreating(): void {
    this.recipeBeingEdited.set(null);
    this.isCreatingRecipe.set(true);
  }
  startEditing(recipe: Recipe): void {
    this.recipeBeingEdited.set(recipe);
    this.isCreatingRecipe.set(false);
  }
  closeRecipeForm(): void {
    this.recipeBeingEdited.set(null);
    this.isCreatingRecipe.set(false);
  }
  saveRecipe(event: { id: string | null; recipe: Omit<Recipe, 'id'> }): void {
    if (event.id) this.menu.updateRecipe(event.id, event.recipe);
    else this.menu.add(event.recipe);
    this.closeRecipeForm();
  }
}

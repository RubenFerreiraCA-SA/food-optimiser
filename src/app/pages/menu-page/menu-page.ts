import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuService, Recipe } from '../../services/menu.service';
import { Dialog, DialogConfig } from '../../shared/components/dialog/dialog';

@Component({
  selector: 'app-menu-page',
  imports: [RouterLink, Dialog],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.scss',
})
export class MenuPage {
  readonly menu = inject(MenuService);
  readonly recipeToRemove = signal<Recipe | null>(null);
  requestRemoval(recipe: Recipe): void { this.recipeToRemove.set(recipe); }
  cancelRemoval(): void { this.recipeToRemove.set(null); }
  confirmRemoval(): void { const recipe = this.recipeToRemove(); if (recipe) this.menu.remove(recipe.id); this.recipeToRemove.set(null); }
  removeDialog(recipe: Recipe): DialogConfig {
    return { eyebrow: 'Remove recipe', title: `Remove ${recipe.name}?`, description: 'This will remove it from your available menu. You can restore it later by resetting the menu.', actions: [{ id: 'cancel', label: 'Keep recipe', variant: 'secondary' }, { id: 'confirm', label: 'Remove recipe', variant: 'danger' }] };
  }
  handleRemoveDialog(action: string): void { action === 'confirm' ? this.confirmRemoval() : this.cancelRemoval(); }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Recipe } from '../../../services/menu.service';

@Component({
  selector: 'app-confirm-menu-view',
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
}

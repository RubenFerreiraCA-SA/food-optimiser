import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { PlanningIngredient } from '../planner-page';
import { IngredientTable, IngredientTableConfig } from '../../../shared/components/ingredient-table/ingredient-table';

@Component({
  selector: 'app-confirm-ingredients-view',
  imports: [FormsModule, IngredientTable],
  templateUrl: './confirm-ingredients-view.html',
  styleUrl: './confirm-ingredients-view.scss',
})
export class ConfirmIngredientsView {
  @Input({ required: true }) ingredients: PlanningIngredient[] = [];
  @Output() readonly quantityChange = new EventEmitter<{ id: string; quantity: number }>();
  @Output() readonly confirmed = new EventEmitter<void>();

  get ingredientTable(): IngredientTableConfig {
    return {
      caption: 'Ingredients available for this meal plan',
      quantityHeader: 'Quantity available',
      rows: this.ingredients.map((ingredient) => ({ id: ingredient.id, name: ingredient.name, quantity: ingredient.planningQuantity })),
      quantityMode: 'always-edit',
    };
  }
}

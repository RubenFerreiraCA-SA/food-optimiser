import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { PlanningIngredient } from '../planner-page';

@Component({
  selector: 'app-confirm-ingredients-view',
  imports: [FormsModule],
  templateUrl: './confirm-ingredients-view.html',
  styleUrl: './confirm-ingredients-view.scss',
})
export class ConfirmIngredientsView {
  @Input({ required: true }) ingredients: PlanningIngredient[] = [];
  @Output() readonly quantityChange = new EventEmitter<{ id: string; quantity: number }>();
  @Output() readonly confirmed = new EventEmitter<void>();
}

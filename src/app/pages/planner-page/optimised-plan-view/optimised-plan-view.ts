import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PlannedMeal } from '../planner-page';

@Component({
  selector: 'app-optimised-plan-view',
  templateUrl: './optimised-plan-view.html',
  styleUrl: './optimised-plan-view.scss',
})
export class OptimisedPlanView {
  @Input({ required: true }) meals: PlannedMeal[] = [];
  @Input({ required: true }) totalServings = 0;
  @Input({ required: true }) totalMeals = 0;
  @Input({ required: true }) recipeCount = 0;
  @Output() readonly adjustMenu = new EventEmitter<void>();
  @Output() readonly startNew = new EventEmitter<void>();
}

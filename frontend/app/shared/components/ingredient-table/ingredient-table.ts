import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type IngredientQuantityMode = 'readonly' | 'always-edit' | 'editing';

export interface IngredientTableRow {
  id: string;
  name: string;
  quantity: number;
}

export interface IngredientTableAction {
  id: string;
  label: string;
  variant?: 'default' | 'remove';
}

export interface IngredientTableConfig {
  caption: string;
  quantityHeader: string;
  rows: IngredientTableRow[];
  quantityMode: IngredientQuantityMode;
  showQuantityLabel?: boolean;
  actions?: IngredientTableAction[];
  editingId?: string | null;
  editingQuantity?: number;
  editError?: string;
}

export interface IngredientTableEvent {
  action: string;
  row: IngredientTableRow;
}

@Component({
  selector: 'app-ingredient-table',
  imports: [FormsModule],
  templateUrl: './ingredient-table.html',
  styleUrl: './ingredient-table.scss',
})
export class IngredientTable {
  @Input({ required: true }) config!: IngredientTableConfig;
  @Output() readonly action = new EventEmitter<IngredientTableEvent>();
  @Output() readonly quantityChange = new EventEmitter<{
    row: IngredientTableRow;
    quantity: number;
  }>();

  isEditing(row: IngredientTableRow): boolean {
    return this.config.quantityMode === 'editing' && this.config.editingId === row.id;
  }
}

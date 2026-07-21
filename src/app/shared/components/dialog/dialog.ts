import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface DialogAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
}

export interface DialogListItem {
  label: string;
  detail: string;
}

export interface DialogConfig {
  eyebrow: string;
  title: string;
  description: string;
  actions: DialogAction[];
  list?: DialogListItem[];
}

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog {
  @Input({ required: true }) config!: DialogConfig;
  @Output() readonly action = new EventEmitter<string>();
}

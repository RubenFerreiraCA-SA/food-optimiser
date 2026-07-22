import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ActionCardIcon = 'ingredients' | 'meals' | 'optimise';

export interface ActionCardConfig {
  href: string;
  title: string;
  description: string;
  icon: ActionCardIcon;
  featured?: boolean;
}

@Component({
  selector: 'app-action-card',
  imports: [RouterLink],
  templateUrl: './action-card.html',
  styleUrl: './action-card.scss',
})
export class ActionCard {
  @Input({ required: true }) config!: ActionCardConfig;
}

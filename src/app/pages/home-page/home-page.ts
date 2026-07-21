import { Component } from '@angular/core';
import { HeroIllustration } from './hero-illustration/hero-illustration';
import { ActionCard, ActionCardConfig } from '../../shared/components/action-card/action-card';

@Component({
  selector: 'app-home-page',
  imports: [HeroIllustration, ActionCard],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  readonly actionCards: ActionCardConfig[] = [
    {
      href: '/pantry',
      title: "What's in the Pantry",
      description: 'Update the ingredients you have available.',
      icon: 'ingredients',
    },
    {
      href: '/menu',
      title: "What's on the Menu",
      description: 'Add the meals and recipes you can make.',
      icon: 'meals',
    },
    {
      href: '/planner',
      title: 'Optimise Meal Plan',
      description: 'Find the meal mix that makes your ingredients go furthest.',
      icon: 'optimise',
      featured: true,
    },
  ];
}

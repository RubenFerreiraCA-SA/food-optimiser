import { Component, Input } from '@angular/core';

export interface PageHeroConfig {
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
  mark?: string;
  markRotation?: number;
}

@Component({
  selector: 'app-page-hero',
  templateUrl: './page-hero.html',
  styleUrl: './page-hero.scss',
})
export class PageHero {
  @Input({ required: true }) config!: PageHeroConfig;
}

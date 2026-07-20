import { Component } from '@angular/core';
import { HeroIllustration } from '../hero-illustration/hero-illustration';

@Component({
  selector: 'app-home-page',
  imports: [HeroIllustration],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {}

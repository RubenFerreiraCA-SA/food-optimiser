import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './shared/services/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly isAuthRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/login') || this.router.url.startsWith('/register')),
      startWith(this.router.url.startsWith('/login') || this.router.url.startsWith('/register')),
    ),
    { initialValue: this.router.url.startsWith('/login') || this.router.url.startsWith('/register') },
  );
  readonly showTopbar = computed(() => !this.isAuthRoute());
  protected readonly title = signal('meal-optimiser');
}

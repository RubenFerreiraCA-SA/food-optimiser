import { Component, ElementRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly auth = inject(AuthService);
  readonly profileMenuOpen = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly isAuthRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/login') || this.router.url.startsWith('/register')),
      startWith(this.router.url.startsWith('/login') || this.router.url.startsWith('/register')),
    ),
    { initialValue: this.router.url.startsWith('/login') || this.router.url.startsWith('/register') },
  );
  readonly showTopbar = computed(() => !this.isAuthRoute());
  readonly profileName = computed(() => this.getProfileName());
  readonly profileInitial = computed(() => this.getProfileInitial());
  readonly avatarUrl = computed(() => this.auth.user()?.photoURL ?? null);
  readonly avatarImageFailed = signal(false);

  constructor() {
    effect(() => {
      this.avatarUrl();
      this.avatarImageFailed.set(false);
    });
  }

  private getProfileName(): string {
    const user = this.auth.user();
    const rawName = user?.displayName?.trim();
    if (rawName) {
      const parts = rawName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}`;
      }
      return parts[0];
    }

    const emailName = user?.email?.split('@')[0]?.trim();
    if (!emailName) {
      return 'Profile';
    }

    const cleaned = emailName.replace(/[._-]+/g, ' ').trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}`;
    }
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }

  private getProfileInitial(): string {
    const user = this.auth.user();
    const rawName = user?.displayName?.trim();
    if (rawName) {
      const parts = rawName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return parts[parts.length - 1].charAt(0).toUpperCase();
      }
      return rawName.charAt(0).toUpperCase();
    }

    const emailName = user?.email?.split('@')[0]?.trim();
    if (!emailName) {
      return 'U';
    }

    const cleaned = emailName.replace(/[._-]+/g, ' ').trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 1].charAt(0).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.profileMenuOpen.update((value) => !value);
  }

  toggleMobileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.mobileMenuOpen.update((value) => !value);
  }

  handleAvatarError(): void {
    this.avatarImageFailed.set(true);
  }

  closeMenus(): void {
    this.profileMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
  }

  async signOut(): Promise<void> {
    this.closeMenus();
    await this.auth.signOut();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeMenus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus();
  }
}

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Topbar } from './topbar';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  standalone: true,
  template: '',
})
class DummyRouteComponent {}

describe('Topbar', () => {
  type MockUser = {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  };

  const userState = signal<MockUser | null>(null);
  const readyState = signal(false);
  const signOut = vi.fn(async () => undefined);

  const auth = {
    ready: () => readyState(),
    isAuthenticated: () => !!userState(),
    user: () => userState(),
    signOut,
  };

  let fixture: ComponentFixture<Topbar>;
  let component: Topbar;

  const createComponent = async (url = '/'): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [
        Topbar,
        RouterTestingModule.withRoutes([
          { path: '', component: DummyRouteComponent },
          { path: 'login', component: DummyRouteComponent },
          { path: 'register', component: DummyRouteComponent },
          { path: 'pantry', component: DummyRouteComponent },
          { path: 'menu', component: DummyRouteComponent },
          { path: 'planner', component: DummyRouteComponent },
        ]),
      ],
      providers: [{ provide: AuthService, useValue: auth }],
    }).compileComponents();

    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
  };

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    readyState.set(false);
    userState.set(null);
    signOut.mockClear();
  });

  describe('given an auth route', () => {
    it('should hide the topbar entirely', async () => {
      readyState.set(true);

      // Assemble
      await createComponent('/login');

      // Act
      await render();

      // Assert
      expect(fixture.nativeElement.querySelector('.topbar')).toBeNull();
    });
  });

  describe('given auth is not ready', () => {
    it('should render only the header shell', async () => {
      // Assemble
      await createComponent('/');

      // Act
      await render();

      // Assert
      expect(fixture.nativeElement.querySelector('.topbar')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.brand')).toBeNull();
      expect(fixture.nativeElement.querySelector('.topbar-actions')).toBeNull();
      expect(fixture.nativeElement.querySelector('.topbar-nav')).toBeNull();
    });
  });

  describe('given a signed out user', () => {
    it('should render the marketing links and sign in actions', async () => {
      readyState.set(true);

      // Assemble
      await createComponent('/');

      // Act
      await render();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Make the most of what you have');
      expect(fixture.nativeElement.textContent).toContain('Sign in');
      expect(fixture.nativeElement.textContent).toContain('Register');
      expect(fixture.nativeElement.querySelector('.topbar-actions')).toBeTruthy();
    });
  });

  describe('given a signed in user', () => {
    it('should render navigation, open menus, fall back to an avatar, and sign out', async () => {
      readyState.set(true);
      userState.set({
        displayName: 'Jane Doe',
        email: 'jane.doe@example.com',
        photoURL: 'https://example.com/avatar.png',
      });

      // Assemble
      await createComponent('/');

      // Act
      await render();
      (fixture.nativeElement.querySelector('.profile-button') as HTMLButtonElement).click();
      await render();
      (fixture.nativeElement.querySelector('.mobile-menu-button') as HTMLButtonElement).click();
      await render();
      (fixture.nativeElement.querySelector('img.avatar-image') as HTMLImageElement).dispatchEvent(
        new Event('error'),
      );
      await render();
      expect(fixture.nativeElement.querySelector('.mobile-menu-dropdown')).toBeTruthy();
      (fixture.nativeElement.querySelector('.dropdown-item.danger') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Pantry');
      expect(fixture.nativeElement.textContent).toContain('Menu');
      expect(fixture.nativeElement.textContent).toContain('Plan');
      expect(fixture.nativeElement.textContent).toContain('Jane D');
      expect(fixture.nativeElement.querySelector('.avatar-fallback')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.avatar-dropdown')).toBeNull();
      expect(fixture.nativeElement.querySelector('.mobile-menu-dropdown')).toBeNull();
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('given navigation links', () => {
    it('should close menus when the desktop and mobile links are used', async () => {
      readyState.set(true);
      userState.set({
        displayName: 'Jane Doe',
        email: 'jane.doe@example.com',
        photoURL: null,
      });

      // Assemble
      await createComponent('/');

      // Act
      await render();
      (fixture.nativeElement.querySelectorAll('.topbar-nav-link')[0] as HTMLAnchorElement).click();
      await render();
      (fixture.nativeElement.querySelectorAll('.topbar-nav-link')[1] as HTMLAnchorElement).click();
      await render();
      (fixture.nativeElement.querySelectorAll('.topbar-nav-link')[2] as HTMLAnchorElement).click();
      await render();

      (fixture.nativeElement.querySelector('.mobile-menu-button') as HTMLButtonElement).click();
      await render();
      (fixture.nativeElement.querySelectorAll('.mobile-menu-item')[0] as HTMLAnchorElement).click();
      await render();
      (fixture.nativeElement.querySelector('.mobile-menu-button') as HTMLButtonElement).click();
      await render();
      (fixture.nativeElement.querySelectorAll('.mobile-menu-item')[1] as HTMLAnchorElement).click();
      await render();
      (fixture.nativeElement.querySelector('.mobile-menu-button') as HTMLButtonElement).click();
      await render();
      (fixture.nativeElement.querySelectorAll('.mobile-menu-item')[2] as HTMLAnchorElement).click();
      await render();
      (fixture.nativeElement.querySelector('.mobile-menu-button') as HTMLButtonElement).click();
      await render();
      (fixture.nativeElement.querySelector('.mobile-menu-item.danger') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(fixture.nativeElement.querySelector('.avatar-dropdown')).toBeNull();
      expect(fixture.nativeElement.querySelector('.mobile-menu-dropdown')).toBeNull();
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('given open menus', () => {
    it('should close them on outside click and Escape', async () => {
      readyState.set(true);
      userState.set({
        displayName: 'Jane Doe',
        email: 'jane.doe@example.com',
        photoURL: null,
      });

      // Assemble
      await createComponent('/');

      // Act
      await render();
      (fixture.nativeElement.querySelector('.profile-button') as HTMLButtonElement).click();
      (fixture.nativeElement.querySelector('.mobile-menu-button') as HTMLButtonElement).click();
      await render();
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await render();
      (fixture.nativeElement.querySelector('.profile-button') as HTMLButtonElement).click();
      (fixture.nativeElement.querySelector('.mobile-menu-button') as HTMLButtonElement).click();
      await render();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await render();

      // Assert
      expect(fixture.nativeElement.querySelector('.avatar-dropdown')).toBeNull();
      expect(fixture.nativeElement.querySelector('.mobile-menu-dropdown')).toBeNull();
    });
  });

  describe('given profile naming fallbacks', () => {
    it('should derive profile labels from display name, email, and missing user data', async () => {
      readyState.set(true);

      // Assemble
      await createComponent('/');

      // Act
      userState.set({ displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null });
      await render();
      const displayName = component.profileName();
      const displayInitial = component.profileInitial();

      userState.set({ displayName: 'Madonna', email: 'madonna@example.com', photoURL: null });
      await render();
      const singleName = component.profileName();
      const singleInitial = component.profileInitial();

      userState.set({ displayName: null, email: 'jane.doe@example.com', photoURL: null });
      await render();
      const emailName = component.profileName();
      const emailInitial = component.profileInitial();

      userState.set({ displayName: null, email: 'solo@example.com', photoURL: null });
      await render();
      const singleEmailName = component.profileName();
      const singleEmailInitial = component.profileInitial();

      userState.set(null);
      await render();
      const fallbackName = component.profileName();
      const fallbackInitial = component.profileInitial();

      // Assert
      expect(displayName).toBe('Ada L');
      expect(displayInitial).toBe('L');
      expect(singleName).toBe('Madonna');
      expect(singleInitial).toBe('M');
      expect(emailName).toBe('jane D');
      expect(emailInitial).toBe('D');
      expect(singleEmailName).toBe('Solo');
      expect(singleEmailInitial).toBe('S');
      expect(fallbackName).toBe('Profile');
      expect(fallbackInitial).toBe('U');
    });
  });

  describe('given a route change', () => {
    it('should hide the topbar after navigating to an auth route', async () => {
      readyState.set(true);

      // Assemble
      await createComponent('/');

      // Act
      await render();
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/login');
      await render();

      // Assert
      expect(fixture.nativeElement.querySelector('.topbar')).toBeNull();
    });
  });
});

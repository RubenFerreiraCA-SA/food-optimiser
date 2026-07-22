import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  host: { '[class.show-form]': 'showForm()' },
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly showForm = signal(false);
  email = '';
  password = '';
  errorMessage = '';
  isSubmitting = false;

  openForm(): void {
    this.showForm.set(true);
  }

  backToIntro(): void {
    this.showForm.set(false);
  }

  async signIn(): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';
    try {
      await this.auth.signInWithEmail(this.email.trim(), this.password);
      await this.router.navigateByUrl('/home');
    } catch (error) {
      this.errorMessage = this.toMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  async googleSignIn(): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';
    try {
      await this.auth.signInWithGoogle();
      await this.router.navigateByUrl('/home');
    } catch (error) {
      this.errorMessage = this.toMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private toMessage(error: unknown): string {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Check your email and password, then try again.';
    }
    if (code === 'auth/user-not-found') {
      return 'No account exists for that email address.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'The Google sign-in popup was closed before completion.';
    }
    return 'Sign-in failed. Please try again.';
  }
}

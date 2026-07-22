import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
  host: { '[class.show-form]': 'showForm()' },
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly showForm = signal(false);
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  isSubmitting = false;

  openForm(): void {
    this.showForm.set(true);
  }

  backToIntro(): void {
    this.showForm.set(false);
  }

  async register(): Promise<void> {
    this.errorMessage = '';
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isSubmitting = true;
    try {
      await this.auth.registerWithEmail(this.email.trim(), this.password, this.name);
      await this.router.navigateByUrl('/home');
    } catch (error) {
      this.errorMessage = this.toMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  async googleRegister(): Promise<void> {
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
    if (code === 'auth/email-already-in-use') {
      return 'That email address is already registered.';
    }
    if (code === 'auth/invalid-email') {
      return 'Enter a valid email address.';
    }
    if (code === 'auth/weak-password') {
      return 'Use a stronger password.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'The Google sign-in popup was closed before completion.';
    }
    return 'Registration failed. Please try again.';
  }
}

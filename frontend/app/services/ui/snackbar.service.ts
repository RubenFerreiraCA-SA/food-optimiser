import { Injectable, computed, signal } from '@angular/core';

export type SnackbarKind = 'success' | 'error' | 'info';

export interface SnackbarState {
  message: string;
  kind: SnackbarKind;
}

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly defaultDurationMs = 2500;
  private readonly state = signal<SnackbarState | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly snackbar = computed(() => this.state());

  show(message: string, kind: SnackbarKind = 'success', durationMs = this.defaultDurationMs): void {
    this.clearTimer();
    this.state.set({ message, kind });
    this.timer = setTimeout(() => {
      this.state.set(null);
      this.timer = null;
    }, durationMs);
  }

  success(message: string, durationMs = this.defaultDurationMs): void {
    this.show(message, 'success', durationMs);
  }

  info(message: string, durationMs = this.defaultDurationMs): void {
    this.show(message, 'info', durationMs);
  }

  error(message: string, durationMs = 4000): void {
    this.show(message, 'error', durationMs);
  }

  clear(): void {
    this.clearTimer();
    this.state.set(null);
  }

  private clearTimer(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
  }
}

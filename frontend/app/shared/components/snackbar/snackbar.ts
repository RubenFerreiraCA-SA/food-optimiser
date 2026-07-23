import { Component, inject } from '@angular/core';
import { SnackbarService } from '../../../services/core/ui/snackbar.service';

@Component({
  selector: 'app-snackbar',
  templateUrl: './snackbar.html',
  styleUrl: './snackbar.scss',
})
export class Snackbar {
  private readonly snackbarService = inject(SnackbarService);
  readonly snackbar = this.snackbarService.snackbar;

  dismiss(): void {
    this.snackbarService.clear();
  }

  iconFor(kind: 'success' | 'error' | 'info'): string {
    if (kind === 'success') return '✓';
    if (kind === 'error') return '!';
    return 'i';
  }
}

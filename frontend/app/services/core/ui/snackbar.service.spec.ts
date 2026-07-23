import { TestBed } from '@angular/core/testing';
import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should clear the previous timer, expose errors, and reset after the timeout', () => {
    // Arrange
    TestBed.configureTestingModule({ providers: [SnackbarService] });
    const service = TestBed.inject(SnackbarService);
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    // Act
    service.success('Saved successfully', 1_000);
    service.error('Something failed', 4_000);
    vi.advanceTimersByTime(4_000);

    // Assert
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(service.snackbar()).toBeNull();
    expect(service.snackbar()).toBeNull();

    clearTimeoutSpy.mockRestore();
  });
});

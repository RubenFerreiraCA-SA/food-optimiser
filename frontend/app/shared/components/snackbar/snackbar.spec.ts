import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Snackbar } from './snackbar';
import { SnackbarService } from '../../../services/ui/snackbar.service';

describe('Snackbar', () => {
  let fixture: ComponentFixture<Snackbar>;
  let component: Snackbar;
  let snackbarService: SnackbarService;

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [Snackbar],
    }).compileComponents();

    fixture = TestBed.createComponent(Snackbar);
    component = fixture.componentInstance;
    snackbarService = TestBed.inject(SnackbarService);
  };

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    snackbarService?.clear();
  });

  describe('given no snackbar state', () => {
    it('should render nothing', async () => {
      // Assemble
      await createComponent();

      // Act
      await render();

      // Assert
      expect(fixture.nativeElement.querySelector('.snackbar')).toBeNull();
    });
  });

  describe('given an active snackbar', () => {
    it('should render the message, icon, and dismiss button', async () => {
      // Assemble
      await createComponent();
      snackbarService.show('Saved successfully', 'success', 60_000);

      // Act
      await render();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('Saved successfully');
      expect(fixture.nativeElement.querySelector('.snackbar--success')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.snackbar__icon')?.textContent?.trim()).toBe('✓');
      expect(fixture.nativeElement.querySelector('.snackbar__close')).toBeTruthy();
    });
  });

  describe('given a dismiss action', () => {
    it('should clear the snackbar when the close button is clicked', async () => {
      // Assemble
      await createComponent();
      snackbarService.show('Something went wrong', 'error', 60_000);

      // Act
      await render();
      (fixture.nativeElement.querySelector('.snackbar__close') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(snackbarService.snackbar()).toBeNull();
      expect(fixture.nativeElement.querySelector('.snackbar')).toBeNull();
    });
  });

  describe('given icon lookups', () => {
    it('should map snackbar kinds to their icon glyphs', async () => {
      // Assemble
      await createComponent();

      // Act
      const successIcon = component.iconFor('success');
      const errorIcon = component.iconFor('error');
      const infoIcon = component.iconFor('info');

      // Assert
      expect(successIcon).toBe('✓');
      expect(errorIcon).toBe('!');
      expect(infoIcon).toBe('i');
    });
  });
});

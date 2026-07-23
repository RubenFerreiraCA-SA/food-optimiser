import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MenuPage } from './menu-page';
import { Dialog, DialogConfig } from '../../shared/components/dialog/dialog';
import { PageHero, PageHeroConfig } from '../../shared/components/page-hero/page-hero';
import {
  RecipeCard,
  RecipeCardConfig,
  RecipeCardEvent,
} from '../../shared/components/recipe-card/recipe-card';
import { NewRecipeView } from './new-recipe-view/new-recipe-view';
import { MenuService } from '../../services/features/menu/menu.service';
import type { Recipe } from '../../services/domain/models';

@Component({
  selector: 'app-page-hero',
  standalone: true,
  template: '<div class="page-hero">{{ config.title }}</div>',
})
class FakePageHero {
  @Input() config!: PageHeroConfig;
}

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  template: `
    <article class="recipe-card">
      <span class="recipe-name">{{ config.recipe.name }}</span>
      <button class="edit" type="button" (click)="action.emit({ action: 'edit', recipe: config.recipe })">
        Edit
      </button>
      <button
        class="remove"
        type="button"
        (click)="action.emit({ action: 'remove', recipe: config.recipe })"
      >
        Remove
      </button>
    </article>
  `,
})
class FakeRecipeCard {
  @Input({ required: true }) config!: RecipeCardConfig;
  @Output() readonly action = new EventEmitter<RecipeCardEvent>();
}

@Component({
  selector: 'app-dialog',
  standalone: true,
  template: `
    <section class="dialog">
      <h2>{{ config.title }}</h2>
      <button class="cancel" type="button" (click)="action.emit('cancel')">Cancel</button>
      <button class="confirm" type="button" (click)="action.emit('confirm')">Confirm</button>
    </section>
  `,
})
class FakeDialog {
  @Input() config!: DialogConfig;
  @Output() readonly action = new EventEmitter<string>();
}

@Component({
  selector: 'app-new-recipe-view',
  standalone: true,
  template: `
    <section class="new-recipe-view">
      <p class="recipe-name">{{ recipe?.name ?? 'Create new recipe' }}</p>
      <button class="save" type="button" (click)="saved.emit(payload())">Save</button>
      <button class="cancel" type="button" (click)="cancelled.emit()">Cancel</button>
    </section>
  `,
})
class FakeNewRecipeView {
  @Input() recipe: Recipe | null = null;
  @Output() readonly saved = new EventEmitter<{
    id: string | null;
    recipe: Omit<Recipe, 'id'>;
    sourceRecipeId: string | null;
  }>();
  @Output() readonly cancelled = new EventEmitter<void>();

  payload() {
    if (this.recipe) {
      const { id, ...recipe } = this.recipe;
      return {
        id,
        recipe,
        sourceRecipeId: this.recipe.sourceRecipeId ?? null,
      };
    }

    return {
      id: null,
      recipe: {
        name: 'Curry',
        servings: 2,
        image: '',
        ingredients: { rice: 1 },
        origin: 'custom' as const,
      },
      sourceRecipeId: null,
    };
  }
}

describe('MenuPage', () => {
  const recipesState = signal<Recipe[]>([]);
  const menu = {
    recipes: () => recipesState(),
    reset: vi.fn(async () => undefined),
    add: vi.fn(async () => undefined),
    updateRecipe: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
  };

  let fixture: ComponentFixture<MenuPage>;
  let component: MenuPage;

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [MenuPage],
      providers: [{ provide: MenuService, useValue: menu }],
    })
      .overrideComponent(MenuPage, {
        remove: {
          imports: [NewRecipeView, Dialog, PageHero, RecipeCard],
        },
        add: {
          imports: [FakeNewRecipeView, FakeDialog, FakePageHero, FakeRecipeCard],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MenuPage);
    component = fixture.componentInstance;
    await render();
  };

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    recipesState.set([]);
    menu.reset.mockClear();
    menu.add.mockClear();
    menu.updateRecipe.mockClear();
    menu.remove.mockClear();
  });

  describe('given no recipes available', () => {
    it('should render the empty state and open and close the form', async () => {
      // Assemble
      await createComponent();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('0 recipes available');
      expect(fixture.nativeElement.textContent).toContain('Your menu is ready for its first recipe.');
      expect(fixture.nativeElement.querySelectorAll('app-recipe-card').length).toBe(0);

      // Act
      (fixture.nativeElement.querySelector('.empty-state .button.primary') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(component.isRecipeFormOpen()).toBe(true);
      expect(fixture.nativeElement.querySelector('app-new-recipe-view')).toBeTruthy();

      // Act
      (fixture.nativeElement.querySelector('app-new-recipe-view .save') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(menu.add).toHaveBeenCalledWith(
        {
          name: 'Curry',
          servings: 2,
          image: '',
          ingredients: { rice: 1 },
          origin: 'custom',
        },
        null,
      );
      expect(component.isRecipeFormOpen()).toBe(false);
      expect(fixture.nativeElement.querySelector('app-new-recipe-view')).toBeFalsy();

      // Act
      (fixture.nativeElement.querySelector('.empty-state .button.primary') as HTMLButtonElement).click();
      await render();
      (fixture.nativeElement.querySelector('app-new-recipe-view .cancel') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(component.isRecipeFormOpen()).toBe(false);
      expect(fixture.nativeElement.querySelector('app-new-recipe-view')).toBeFalsy();
    });
  });

  describe('given recipes are available', () => {
    const soup: Recipe = {
      id: 'soup',
      name: 'Soup',
      servings: 2,
      image: '',
      ingredients: { tomato: 2 },
      origin: 'shared',
    };
    const salad: Recipe = {
      id: 'salad',
      name: 'Salad',
      servings: 1,
      image: '',
      ingredients: { lettuce: 1 },
      origin: 'custom',
    };

    beforeEach(() => {
      recipesState.set([soup, salad]);
    });

    it('should render recipe cards, wire edit actions, and save updates', async () => {
      // Assemble
      await createComponent();

      // Assert
      expect(fixture.nativeElement.textContent).toContain('2 recipes available');
      expect(fixture.nativeElement.textContent).toContain('Soup');
      expect(fixture.nativeElement.textContent).toContain('Salad');
      expect(fixture.nativeElement.querySelectorAll('app-recipe-card').length).toBe(2);
      expect(menu.reset).not.toHaveBeenCalled();

      const firstCard = fixture.debugElement.query(By.directive(FakeRecipeCard))
        .componentInstance as FakeRecipeCard;

      // Assert
      expect(firstCard.config).toEqual(component.recipeCard(soup));

      // Act
      (fixture.nativeElement.querySelector('app-recipe-card .edit') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(component.recipeBeingEdited()).toEqual(soup);
      expect(component.isRecipeFormOpen()).toBe(true);
      expect(fixture.nativeElement.querySelector('app-new-recipe-view .recipe-name').textContent).toContain(
        'Soup',
      );

      // Act
      (fixture.nativeElement.querySelector('app-new-recipe-view .save') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(menu.updateRecipe).toHaveBeenCalledWith(soup.id, {
        name: 'Soup',
        servings: 2,
        image: '',
        ingredients: { tomato: 2 },
        origin: 'shared',
      });
      expect(component.isRecipeFormOpen()).toBe(false);
      expect(fixture.nativeElement.querySelector('app-new-recipe-view')).toBeFalsy();

      // Act
      (fixture.nativeElement.querySelector('.actions .button.secondary') as HTMLButtonElement).click();

      // Assert
      expect(menu.reset).toHaveBeenCalledTimes(1);
    });

    it('should confirm removals and close the dialog when cancelled', async () => {
      // Assemble
      await createComponent();

      // Act
      await component.confirmRemoval();

      // Assert
      expect(menu.remove).not.toHaveBeenCalled();

      // Act
      (fixture.nativeElement.querySelector('app-recipe-card .remove') as HTMLButtonElement).click();
      await render();

      // Assert
      const dialog = fixture.debugElement.query(By.directive(FakeDialog))
        .componentInstance as FakeDialog;
      expect(dialog.config.title).toBe('Remove Soup?');

      // Act
      (fixture.nativeElement.querySelector('app-dialog .cancel') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(component.recipeToRemove()).toBeNull();
      expect(menu.remove).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('app-dialog')).toBeFalsy();
    });

    it('should remove a recipe when the dialog is confirmed', async () => {
      // Assemble
      await createComponent();

      // Act
      (fixture.nativeElement.querySelector('app-recipe-card .remove') as HTMLButtonElement).click();
      await render();
      (fixture.nativeElement.querySelector('app-dialog .confirm') as HTMLButtonElement).click();
      await render();

      // Assert
      expect(menu.remove).toHaveBeenCalledWith(soup.id);
      expect(component.recipeToRemove()).toBeNull();
      expect(fixture.nativeElement.querySelector('app-dialog')).toBeFalsy();
    });
  });
});

import { Injectable, effect, inject } from '@angular/core';
import { User } from 'firebase/auth';
import { AuthService } from '../../auth/auth.service';
import { DataService } from '../data.service';
import { defaultIngredients, defaultPantryIngredients, defaultRecipes } from './seed-data';
import { GLOBAL_COLLECTIONS, PROFILE_DOC_ID, USER_COLLECTIONS, USER_DATA_DOCS } from '../user-data';

@Injectable({ providedIn: 'root' })
export class DataSeedingService {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);

  constructor() {
    effect(() => {
      this.data.revision();
      const user = this.auth.user();
      if (!this.auth.ready() || !user) return;
      void this.seed();
    });
  }

  async seed(): Promise<void> {
    if (!this.auth.isAuthenticated()) return;

    await this.data.whenReady();

    const user = this.auth.user();
    if (!user) return;

    this.ensureProfile(user);

    if (this.data.collectionSize(GLOBAL_COLLECTIONS.ingredients, 'global') === 0) {
      for (const ingredient of defaultIngredients()) {
        this.data.upsertDocument(GLOBAL_COLLECTIONS.ingredients, ingredient.id, ingredient, 'global');
      }
    }

    if (this.data.collectionSize(GLOBAL_COLLECTIONS.recipes, 'global') === 0) {
      for (const recipe of defaultRecipes()) {
        this.data.upsertDocument(GLOBAL_COLLECTIONS.recipes, recipe.id, recipe, 'global');
      }
    }

    if (this.data.collectionSize(USER_COLLECTIONS.recipes) === 0) {
      const seededRecipes = this.data.replaceCollection(
        USER_COLLECTIONS.recipes,
        defaultRecipes().map((recipe) => ({
          ...recipe,
          origin: 'shared' as const,
          sourceRecipeId: recipe.id,
        })),
      );

      this.data.upsertDocument(USER_COLLECTIONS.data, USER_DATA_DOCS.recipes, {
        values: seededRecipes.map((recipe) => recipe.id),
      });
    } else if (!this.data.hasDocument(USER_COLLECTIONS.data, USER_DATA_DOCS.recipes)) {
      this.data.upsertDocument(
        USER_COLLECTIONS.data,
        USER_DATA_DOCS.recipes,
        { values: [] },
      );
    }

    if (!this.data.hasDocument(USER_COLLECTIONS.data, USER_DATA_DOCS.ingredients)) {
      this.data.upsertDocument(
        USER_COLLECTIONS.data,
        USER_DATA_DOCS.ingredients,
        Object.fromEntries(
          defaultPantryIngredients().map((ingredient) => [ingredient.id, ingredient.quantity]),
        ),
      );
    }

  }

  private ensureProfile(user: User): void {
    if (this.data.hasDocument(USER_COLLECTIONS.profile, PROFILE_DOC_ID)) return;

    const now = new Date().toISOString();
    this.data.upsertDocument(USER_COLLECTIONS.profile, PROFILE_DOC_ID, {
      uid: user.uid,
      displayName: user.displayName ?? user.email ?? 'Guest',
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      providerId: user.providerData[0]?.providerId ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }
}

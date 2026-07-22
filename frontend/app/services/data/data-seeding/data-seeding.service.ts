import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { DataService } from '../data.service';
import { Recipe } from '../../data/shared-types';
import { defaultIngredients, defaultPantryIngredients, defaultRecipes } from './seed-data';
import { GLOBAL_COLLECTIONS, PROFILE_DOC_ID, USER_COLLECTIONS, USER_DATA_DOCS } from '../user-data';

@Injectable({ providedIn: 'root' })
export class DataSeedingService {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);

  async seed(): Promise<void> {
    if (!this.auth.ready() || !this.auth.isAuthenticated()) return;

    await this.data.whenReady();

    this.seedGlobalCollection(GLOBAL_COLLECTIONS.ingredients, defaultIngredients());
    this.seedGlobalCollection(GLOBAL_COLLECTIONS.recipes, defaultRecipes());

    const recipeIds = this.seedUserRecipes();
    this.seedUserPantry(recipeIds);
    this.seedProfile();
  }

  private seedGlobalCollection<T extends { id: string }>(collectionName: string, items: T[]): void {
    if (this.data.collectionSize(collectionName, 'global') === 0) {
      this.data.replaceCollection(collectionName, items, 'global');
    }
  }

  private seedUserRecipes(): string[] {
    if (this.data.collectionSize(USER_COLLECTIONS.recipes, 'user') === 0) {
      return this.data
        .replaceCollection(USER_COLLECTIONS.recipes, defaultRecipes(), 'user')
        .map((recipe) => recipe.id);
    }

    return this.data.readCollection<Recipe>(USER_COLLECTIONS.recipes, [], 'user').map((recipe) => recipe.id);
  }

  private seedUserPantry(recipeIds: string[]): void {
    if (!this.data.hasDocument(USER_COLLECTIONS.data, USER_DATA_DOCS.ingredients, 'user')) {
      this.data.upsertDocument(
        USER_COLLECTIONS.data,
        USER_DATA_DOCS.ingredients,
        Object.fromEntries(defaultPantryIngredients().map((ingredient) => [ingredient.id, ingredient.quantity])),
        'user',
      );
    }

    if (!this.data.hasDocument(USER_COLLECTIONS.data, USER_DATA_DOCS.recipes, 'user')) {
      this.data.upsertDocument(
        USER_COLLECTIONS.data,
        USER_DATA_DOCS.recipes,
        { values: recipeIds },
        'user',
      );
    }
  }

  private seedProfile(): void {
    if (this.data.hasDocument(USER_COLLECTIONS.profile, PROFILE_DOC_ID, 'user')) return;

    const user = this.auth.user();
    const now = new Date().toISOString();

    this.data.upsertDocument(
      USER_COLLECTIONS.profile,
      PROFILE_DOC_ID,
      {
        uid: user?.uid ?? 'guest',
        displayName: user?.displayName?.trim() || 'Guest',
        email: user?.email ?? null,
        photoURL: user?.photoURL ?? null,
        providerId: user?.providerData?.[0]?.providerId ?? null,
        createdAt: now,
        updatedAt: now,
      },
      'user',
    );
  }
}

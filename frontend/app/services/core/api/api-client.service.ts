import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Recipe, SharedIngredient } from '../../domain/models';

export interface UserProfileResponse {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  providerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPantryResponse {
  values: Record<string, number>;
}

export interface UserMenuResponse {
  selectedRecipeIds: string[];
}

export interface UpsertRecipeRequest {
  name: string;
  servings: number;
  image: string;
  ingredients: Record<string, number>;
  sourceRecipeId: string | null;
}

export interface UpdatePantryRequest {
  values: Record<string, number>;
}

export interface UpdatePantryItemRequest {
  quantity: number;
}

export interface UpdateMenuRequest {
  values: string[];
}

export interface CreateIngredientRequest {
  name: string;
  image: string;
}

export interface PlannerIngredientRequest {
  id: string;
  name: string;
  quantity: number;
}

export interface PlanRecipeRequest {
  id: string;
  name: string;
  servings: number;
  image: string;
  ingredients: Record<string, number>;
}

export interface PlanRequest {
  availableIngredients: PlannerIngredientRequest[];
  recipes: PlanRecipeRequest[];
}

export interface OptimisedPlanMealResponse {
  recipeId: string;
  name: string;
  dishes: number;
  meals: number;
  ingredients: string;
}

export interface IngredientPlanUsageResponse {
  id: string;
  name: string;
  before: number;
  used: number;
  left: number;
}

export interface OptimisedPlanResponse {
  meals: OptimisedPlanMealResponse[];
  totalDishes: number;
  totalMeals: number;
  ingredients: IngredientPlanUsageResponse[];
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  async getProfile(): Promise<UserProfileResponse> {
    return firstValueFrom(this.http.get<UserProfileResponse>(this.url('/profile')));
  }

  async getPantry(): Promise<UserPantryResponse> {
    return firstValueFrom(this.http.get<UserPantryResponse>(this.url('/pantry')));
  }

  async replacePantry(values: Record<string, number>): Promise<UserPantryResponse> {
    return firstValueFrom(this.http.put<UserPantryResponse>(this.url('/pantry'), { values }));
  }

  async addPantryIngredient(ingredientId: string, quantity: number): Promise<UserPantryResponse> {
    return firstValueFrom(
      this.http.post<UserPantryResponse>(this.url(`/pantry/${encodeURIComponent(ingredientId)}`), {
        quantity,
      }),
    );
  }

  async setPantryIngredient(ingredientId: string, quantity: number): Promise<UserPantryResponse> {
    return firstValueFrom(
      this.http.put<UserPantryResponse>(this.url(`/pantry/${encodeURIComponent(ingredientId)}`), {
        quantity,
      }),
    );
  }

  async removePantryIngredient(ingredientId: string): Promise<UserPantryResponse> {
    return firstValueFrom(
      this.http.delete<UserPantryResponse>(this.url(`/pantry/${encodeURIComponent(ingredientId)}`)),
    );
  }

  async getMenu(): Promise<UserMenuResponse> {
    return firstValueFrom(this.http.get<UserMenuResponse>(this.url('/menu')));
  }

  async replaceMenu(values: string[]): Promise<UserMenuResponse> {
    return firstValueFrom(this.http.put<UserMenuResponse>(this.url('/menu'), { values }));
  }

  async addMenuRecipe(recipeId: string): Promise<UserMenuResponse> {
    return firstValueFrom(
      this.http.post<UserMenuResponse>(this.url(`/menu/${encodeURIComponent(recipeId)}`), null),
    );
  }

  async removeMenuRecipe(recipeId: string): Promise<UserMenuResponse> {
    return firstValueFrom(
      this.http.delete<UserMenuResponse>(this.url(`/menu/${encodeURIComponent(recipeId)}`)),
    );
  }

  async getSharedRecipes(): Promise<Recipe[]> {
    return firstValueFrom(this.http.get<Recipe[]>(this.url('/menu/shared-recipes')));
  }

  async getPersonalRecipes(): Promise<Recipe[]> {
    return firstValueFrom(this.http.get<Recipe[]>(this.url('/menu/personal-recipes')));
  }

  async getAllMenuRecipes(): Promise<Recipe[]> {
    return firstValueFrom(this.http.get<Recipe[]>(this.url('/menu/all')));
  }

  async createPersonalRecipe(request: UpsertRecipeRequest): Promise<Recipe> {
    return firstValueFrom(this.http.post<Recipe>(this.url('/menu/personal-recipes'), request));
  }

  async updatePersonalRecipe(recipeId: string, request: UpsertRecipeRequest): Promise<Recipe> {
    return firstValueFrom(
      this.http.put<Recipe>(this.url(`/menu/personal-recipes/${encodeURIComponent(recipeId)}`), request),
    );
  }

  async deletePersonalRecipe(recipeId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(this.url(`/menu/personal-recipes/${encodeURIComponent(recipeId)}`)),
    );
  }

  async getIngredients(): Promise<SharedIngredient[]> {
    return firstValueFrom(this.http.get<SharedIngredient[]>(this.url('/ingredients')));
  }

  async createIngredient(request: CreateIngredientRequest): Promise<SharedIngredient> {
    return firstValueFrom(this.http.post<SharedIngredient>(this.url('/ingredients'), request));
  }

  async getRecipes(): Promise<Recipe[]> {
    return firstValueFrom(this.http.get<Recipe[]>(this.url('/recipes')));
  }

  async createRecipe(request: UpsertRecipeRequest): Promise<Recipe> {
    return firstValueFrom(this.http.post<Recipe>(this.url('/recipes'), request));
  }

  async createPlan(request: PlanRequest): Promise<OptimisedPlanResponse> {
    return firstValueFrom(this.http.post<OptimisedPlanResponse>(this.url('/plan'), request));
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}

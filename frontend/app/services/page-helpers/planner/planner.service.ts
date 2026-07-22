import { Injectable, inject } from '@angular/core';
import { IngredientCatalogService } from '../../data/ingredient-catalog.service';
import type { Recipe } from '../../data/shared-types';

export interface PlannerIngredientInput {
  id: string;
  name: string;
  quantity: number;
}
export interface OptimisedPlanMeal {
  recipeId: string;
  name: string;
  dishes: number;
  meals: number;
  ingredients: string;
}
export interface IngredientPlanUsage {
  id: string;
  name: string;
  before: number;
  used: number;
  left: number;
}
export interface OptimisedPlan {
  meals: OptimisedPlanMeal[];
  totalDishes: number;
  totalMeals: number;
  ingredients: IngredientPlanUsage[];
}

interface CandidateRecipe {
  recipe: Recipe;
  requirements: number[];
}
interface Bounds {
  lower: number[];
  upper: number[];
}
interface LinearSolution {
  values: number[];
  score: number;
}

/**
 * Integer meal planning with a primal-simplex LP relaxation and branch-and-bound backtracking.
 * The simplex score prioritises meals, then uses dish count as a deterministic tie breaker.
 */
@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly epsilon = 1e-7;
  private readonly ingredients = inject(IngredientCatalogService);

  optimise(availableIngredients: PlannerIngredientInput[], recipes: Recipe[]): OptimisedPlan {
    const pantry = availableIngredients.map((ingredient) => ({
      ...ingredient,
      quantity: this.toQuantity(ingredient.quantity),
      key: ingredient.id,
    }));
    const indexByIngredient = new Map(pantry.map((ingredient, index) => [ingredient.key, index]));
    const candidates = this.createCandidates(recipes, indexByIngredient, pantry.length);
    const capacities = pantry.map((ingredient) => ingredient.quantity);
    const tieWeight =
      1 + candidates.reduce((sum, candidate) => sum + this.maxDishes(candidate, capacities), 0);
    const objective = candidates.map((candidate) => candidate.recipe.servings * tieWeight + 1);
    const root: Bounds = {
      lower: Array(candidates.length).fill(0),
      upper: candidates.map((candidate) => this.maxDishes(candidate, capacities)),
    };
    let bestValues = Array<number>(candidates.length).fill(0);
    let bestScore = 0;

    const search = (bounds: Bounds): void => {
      const solution = this.solveRelaxation(candidates, capacities, objective, bounds);
      if (!solution || solution.score < bestScore - this.epsilon) return;

      const fractionalIndex = solution.values.findIndex(
        (value) => Math.abs(value - Math.round(value)) > this.epsilon,
      );
      if (fractionalIndex === -1) {
        const values = solution.values.map((value) => Math.round(value));
        if (
          solution.score > bestScore + this.epsilon ||
          (Math.abs(solution.score - bestScore) <= this.epsilon &&
            this.totalDishes(values) > this.totalDishes(bestValues))
        ) {
          bestValues = values;
          bestScore = solution.score;
        }
        return;
      }

      const value = solution.values[fractionalIndex];
      const floor = Math.floor(value);
      const ceil = Math.ceil(value);
      if (floor >= bounds.lower[fractionalIndex]) {
        const left = this.copyBounds(bounds);
        left.upper[fractionalIndex] = Math.min(left.upper[fractionalIndex], floor);
        if (left.lower[fractionalIndex] <= left.upper[fractionalIndex]) search(left);
      }
      if (ceil <= bounds.upper[fractionalIndex]) {
        const right = this.copyBounds(bounds);
        right.lower[fractionalIndex] = Math.max(right.lower[fractionalIndex], ceil);
        if (right.lower[fractionalIndex] <= right.upper[fractionalIndex]) search(right);
      }
    };

    search(root);
    const used = capacities.map((_, ingredientIndex) =>
      candidates.reduce(
        (sum, candidate, recipeIndex) =>
          sum + candidate.requirements[ingredientIndex] * bestValues[recipeIndex],
        0,
      ),
    );
    const totalMeals = candidates.reduce(
      (sum, candidate, index) => sum + candidate.recipe.servings * bestValues[index],
      0,
    );

    return {
      totalMeals,
      totalDishes: this.totalDishes(bestValues),
      meals: candidates.flatMap((candidate, index) => {
        const dishes = bestValues[index];
        return dishes
          ? [
              {
                recipeId: candidate.recipe.id,
                name: candidate.recipe.name,
                dishes,
                meals: candidate.recipe.servings * dishes,
                ingredients: Object.entries(candidate.recipe.ingredients)
                  .map(([ingredientId, quantity]) => `${quantity}× ${this.ingredients.nameFor(ingredientId)}`)
                  .join(', '),
              },
            ]
          : [];
      }),
      ingredients: pantry.map((ingredient, index) => ({
        id: ingredient.id,
        name: ingredient.name,
        before: ingredient.quantity,
        used: used[index],
        left: ingredient.quantity - used[index],
      })),
    };
  }

  private solveRelaxation(
    candidates: CandidateRecipe[],
    capacities: number[],
    objective: number[],
    bounds: Bounds,
  ): LinearSolution | null {
    const lowerUse = capacities.map((_, ingredientIndex) =>
      candidates.reduce(
        (sum, candidate, recipeIndex) =>
          sum + candidate.requirements[ingredientIndex] * bounds.lower[recipeIndex],
        0,
      ),
    );
    if (lowerUse.some((used, index) => used > capacities[index])) return null;

    const rows: number[][] = candidates.length
      ? candidates[0].requirements.map((_, ingredientIndex) =>
          candidates.map((candidate) => candidate.requirements[ingredientIndex]),
        )
      : [];
    const rhs = capacities.map((capacity, index) => capacity - lowerUse[index]);
    candidates.forEach((_, index) => {
      const range = bounds.upper[index] - bounds.lower[index];
      if (range < 0) return;
      rows.push(candidates.map((__, candidateIndex) => (candidateIndex === index ? 1 : 0)));
      rhs.push(range);
    });

    const relaxation = this.simplex(rows, rhs, objective);
    if (!relaxation) return null;
    const values = relaxation.values.map((value, index) => value + bounds.lower[index]);
    return {
      values,
      score:
        relaxation.score +
        bounds.lower.reduce((sum, value, index) => sum + value * objective[index], 0),
    };
  }

  /** Solves max c·x, subject to Ax ≤ b and x ≥ 0, with b constrained to non-negative values. */
  private simplex(matrix: number[][], rhs: number[], objective: number[]): LinearSolution | null {
    const variables = objective.length;
    if (!variables) return { values: [], score: 0 };
    const constraints = matrix.length;
    const tableau = matrix.map((row, rowIndex) => [
      ...row,
      ...Array.from({ length: constraints }, (_, slackIndex) => (slackIndex === rowIndex ? 1 : 0)),
      rhs[rowIndex],
    ]);
    tableau.push([...objective.map((value) => -value), ...Array(constraints).fill(0), 0]);

    while (true) {
      const objectiveRow = tableau[constraints];
      let entering = -1;
      for (let index = 0; index < variables + constraints; index += 1) {
        if (
          objectiveRow[index] < -this.epsilon &&
          (entering === -1 || objectiveRow[index] < objectiveRow[entering])
        )
          entering = index;
      }
      if (entering === -1) break;

      let leaving = -1;
      for (let row = 0; row < constraints; row += 1) {
        const coefficient = tableau[row][entering];
        if (coefficient <= this.epsilon) continue;
        if (
          leaving === -1 ||
          tableau[row][variables + constraints] / coefficient <
            tableau[leaving][variables + constraints] / tableau[leaving][entering] - this.epsilon
        )
          leaving = row;
      }
      if (leaving === -1) return null;
      this.pivot(tableau, leaving, entering);
    }

    const values = Array<number>(variables).fill(0);
    for (let column = 0; column < variables; column += 1) {
      let basicRow = -1;
      for (let row = 0; row < constraints; row += 1) {
        if (
          Math.abs(tableau[row][column] - 1) <= this.epsilon &&
          tableau.every(
            (other, otherRow) => otherRow === row || Math.abs(other[column]) <= this.epsilon,
          )
        ) {
          basicRow = row;
          break;
        }
      }
      if (basicRow !== -1) values[column] = tableau[basicRow][variables + constraints];
    }
    return { values, score: tableau[constraints][variables + constraints] };
  }

  private pivot(tableau: number[][], pivotRow: number, pivotColumn: number): void {
    const pivot = tableau[pivotRow][pivotColumn];
    tableau[pivotRow] = tableau[pivotRow].map((value) => value / pivot);
    tableau.forEach((row, rowIndex) => {
      if (rowIndex === pivotRow) return;
      const factor = row[pivotColumn];
      if (Math.abs(factor) <= this.epsilon) return;
      tableau[rowIndex] = row.map((value, index) => value - factor * tableau[pivotRow][index]);
    });
  }

  private createCandidates(
    recipes: Recipe[],
    ingredientIndex: Map<string, number>,
    pantrySize: number,
  ): CandidateRecipe[] {
    return recipes.flatMap((recipe) => {
      if (
        !Number.isInteger(recipe.servings) ||
        recipe.servings < 1 ||
        !Object.keys(recipe.ingredients).length
      )
        return [];
      const requirements = Array<number>(pantrySize).fill(0);
      for (const [ingredientId, amount] of Object.entries(recipe.ingredients)) {
        const index = ingredientIndex.get(ingredientId);
        const quantity = this.toQuantity(amount);
        if (index === undefined || quantity < 1) return [];
        requirements[index] += quantity;
      }
      return [{ recipe, requirements }];
    });
  }

  private maxDishes(candidate: CandidateRecipe, capacities: number[]): number {
    return candidate.requirements.reduce(
      (maximum, required, index) =>
        required ? Math.min(maximum, Math.floor(capacities[index] / required)) : maximum,
      Number.MAX_SAFE_INTEGER,
    );
  }

  private copyBounds(bounds: Bounds): Bounds {
    return { lower: [...bounds.lower], upper: [...bounds.upper] };
  }
  private totalDishes(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0);
  }
  private toQuantity(quantity: number): number {
    return Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
  }
}

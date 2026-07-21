import { PlannerService } from './planner.service';

describe('PlannerService', () => {
  it('maximises meals by accounting for each recipe serving multiple people', () => {
    const service = new PlannerService();
    const result = service.optimise(
      [
        { id: 'dough', name: 'Dough', quantity: 4 },
        { id: 'tomato', name: 'Tomato', quantity: 2 },
        { id: 'cheese', name: 'Cheese', quantity: 2 },
      ],
      [
        {
          id: 'pasta',
          name: 'Pasta',
          servings: 3,
          ingredients: [
            { name: 'Dough', quantity: 2 },
            { name: 'Tomato', quantity: 1 },
            { name: 'Cheese', quantity: 1 },
          ],
        },
        {
          id: 'toast',
          name: 'Toast',
          servings: 1,
          ingredients: [{ name: 'Dough', quantity: 1 }],
        },
      ],
    );

    expect(result.totalMeals).toBe(6);
    expect(result.totalDishes).toBe(2);
    expect(result.meals).toEqual([
      expect.objectContaining({ recipeId: 'pasta', dishes: 2, meals: 6 }),
    ]);
    expect(result.ingredients).toEqual([
      expect.objectContaining({ name: 'Dough', before: 4, used: 4, left: 0 }),
      expect.objectContaining({ name: 'Tomato', before: 2, used: 2, left: 0 }),
      expect.objectContaining({ name: 'Cheese', before: 2, used: 2, left: 0 }),
    ]);
  });

  it('branches from a fractional simplex solution to a whole-dish optimum', () => {
    const service = new PlannerService();
    const result = service.optimise(
      [
        { id: 'a', name: 'A', quantity: 2 },
        { id: 'b', name: 'B', quantity: 2 },
      ],
      [
        {
          id: 'meal-a',
          name: 'Meal A',
          servings: 3,
          ingredients: [
            { name: 'A', quantity: 2 },
            { name: 'B', quantity: 1 },
          ],
        },
        {
          id: 'meal-b',
          name: 'Meal B',
          servings: 2,
          ingredients: [
            { name: 'A', quantity: 1 },
            { name: 'B', quantity: 2 },
          ],
        },
      ],
    );

    expect(result.totalMeals).toBe(3);
    expect(result.totalDishes).toBe(1);
    expect(result.meals).toEqual([
      expect.objectContaining({ recipeId: 'meal-a', dishes: 1, meals: 3 }),
    ]);
  });
});

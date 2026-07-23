import { PlannerService } from './planner.service';

describe('PlannerService', () => {
  const createApi = () => ({
    createPlan: vi.fn(),
  });

  const createSnackbar = () => ({
    success: vi.fn(),
  });

  it('maximises meals by accounting for each recipe serving multiple people', () => {
    // Arrange
    const service = new PlannerService();

    // Act
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

    // Assert
    expect(result.totalMeals).toBe(6);
    expect(result.totalDishes).toBe(2);
    expect(result.meals).toEqual([expect.objectContaining({ recipeId: 'pasta', dishes: 2, meals: 6 })]);
    expect(result.ingredients).toEqual([
      expect.objectContaining({ name: 'Dough', before: 4, used: 4, left: 0 }),
      expect.objectContaining({ name: 'Tomato', before: 2, used: 2, left: 0 }),
      expect.objectContaining({ name: 'Cheese', before: 2, used: 2, left: 0 }),
    ]);
  });

  it('aliases optimize to optimise', () => {
    // Arrange
    const service = new PlannerService();

    // Act
    const result = service.optimize(
      [{ id: 'rice', name: 'Rice', quantity: 2 }],
      [
        {
          id: 'rice-bowl',
          name: 'Rice Bowl',
          servings: 2,
          ingredients: [{ name: 'Rice', quantity: 1 }],
        },
      ],
    );

    // Assert
    expect(result.totalMeals).toBe(4);
    expect(result.totalDishes).toBe(2);
  });

  it('ignores unknown and zero-quantity ingredients in the optimiser', () => {
    // Arrange
    const service = new PlannerService();

    // Act
    const result = service.optimise(
      [
        { id: 'tomato', name: 'Tomato', quantity: 3.8 },
        { id: 'onion', name: 'Onion', quantity: Number.NaN },
      ],
      [
        {
          id: 'soup',
          name: 'Soup',
          servings: 2.2,
          ingredients: [
            { name: 'Tomato', quantity: 2 },
            { name: 'Parsley', quantity: 1 },
            { name: 'Onion', quantity: 0 },
          ],
        },
      ],
    );

    // Assert
    expect(result.totalMeals).toBe(0);
    expect(result.totalDishes).toBe(0);
    expect(result.meals).toEqual([]);
    expect(result.ingredients).toEqual([
      expect.objectContaining({ name: 'Tomato', before: 3, used: 0, left: 3 }),
      expect.objectContaining({ name: 'Onion', before: 0, used: 0, left: 0 }),
    ]);
  });

  it('creates a plan from the API request payload and reports success', async () => {
    // Arrange
    const api = createApi();
    const snackbar = createSnackbar();
    const service = new PlannerService(api as never, snackbar as never);
    api.createPlan.mockResolvedValue({
      meals: [],
      totalDishes: 0,
      totalMeals: 0,
      ingredients: [],
    });

    // Act
    await service.createPlan(
      [
        { id: 'tomato', name: 'Tomato', quantity: 3.9 },
        { id: 'onion', name: 'Onion', quantity: -1 },
      ],
      [
        {
          id: 'soup',
          name: 'Soup',
          servings: 2,
          image: 'soup.png',
          ingredients: { tomato: 2, onion: 1 },
        },
      ],
    );

    // Assert
    expect(api.createPlan).toHaveBeenCalledWith({
      availableIngredients: [
        { id: 'tomato', name: 'Tomato', quantity: 3 },
        { id: 'onion', name: 'Onion', quantity: 0 },
      ],
      recipes: [
        {
          id: 'soup',
          name: 'Soup',
          servings: 2,
          image: 'soup.png',
          ingredients: { tomato: 2, onion: 1 },
        },
      ],
    });
    expect(service.plan()).toEqual({
      meals: [],
      totalDishes: 0,
      totalMeals: 0,
      ingredients: [],
    });
    expect(service.loading()).toBe(false);
    expect(service.error()).toBe('');
    expect(snackbar.success).toHaveBeenCalledWith('Plan ready');
  });

  it('records an error when the API plan request fails', async () => {
    // Arrange
    const api = createApi();
    const snackbar = createSnackbar();
    const service = new PlannerService(api as never, snackbar as never);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    api.createPlan.mockRejectedValue(new Error('boom'));

    // Act
    await service.createPlan([{ id: 'tomato', name: 'Tomato', quantity: 1 }], []);

    // Assert
    expect(service.plan()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBe('Unable to create a plan right now. Please try again.');
    expect(snackbar.success).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith('Failed to create plan from API:', expect.any(Error));

    consoleError.mockRestore();
  });

  it('clears the current plan state', async () => {
    // Arrange
    const service = new PlannerService();
    await service.createPlan(
      [{ id: 'tomato', name: 'Tomato', quantity: 1 }],
      [
        {
          id: 'soup',
          name: 'Soup',
          servings: 1,
          image: '',
          ingredients: { tomato: 1 },
        },
      ],
    );

    // Act
    service.clear();

    // Assert
    expect(service.plan()).toBeNull();
    expect(service.error()).toBe('');
    expect(service.loading()).toBe(false);
  });

  it('branches from a fractional simplex solution to a whole-dish optimum', () => {
    // Arrange
    const service = new PlannerService();

    // Act
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

    // Assert
    expect(result.totalMeals).toBe(3);
    expect(result.totalDishes).toBe(1);
    expect(result.meals).toEqual([expect.objectContaining({ recipeId: 'meal-a', dishes: 1, meals: 3 })]);
  });
});

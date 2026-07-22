namespace MealOptimiser.Api.Contracts.Planning;

/// <summary>
/// The result of the meal planner.
/// </summary>
/// <param name="Meals">The planned recipes and dish counts.</param>
/// <param name="TotalDishes">The total number of dishes selected.</param>
/// <param name="TotalMeals">The total number of servings produced.</param>
/// <param name="Ingredients">Ingredient usage details for the plan.</param>
public sealed record OptimisedPlanResponse(
    IReadOnlyList<OptimisedPlanMealResponse> Meals,
    int TotalDishes,
    int TotalMeals,
    IReadOnlyList<IngredientPlanUsageResponse> Ingredients);

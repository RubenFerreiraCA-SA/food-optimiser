namespace MealOptimiser.Api.Contracts.Planning;

/// <summary>
/// The payload for generating an optimised meal plan.
/// </summary>
/// <param name="AvailableIngredients">The ingredients available for planning.</param>
/// <param name="Recipes">The recipes to consider.</param>
public sealed record PlanRequest(
    IReadOnlyList<PlannerIngredientRequest> AvailableIngredients,
    IReadOnlyList<PlanRecipeRequest> Recipes);

namespace MealOptimiser.Api.Contracts.Planning;

/// <summary>
/// A recipe included in the optimised plan.
/// </summary>
/// <param name="RecipeId">The recipe id.</param>
/// <param name="Name">The recipe name.</param>
/// <param name="Dishes">The number of dishes selected.</param>
/// <param name="Meals">The number of servings produced.</param>
/// <param name="Ingredients">A human-readable ingredient summary.</param>
public sealed record OptimisedPlanMealResponse(
    string RecipeId,
    string Name,
    int Dishes,
    int Meals,
    string Ingredients);

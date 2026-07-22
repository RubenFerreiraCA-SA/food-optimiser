namespace MealOptimiser.Api.Contracts.Planning;

/// <summary>
/// Ingredient usage within the optimised plan.
/// </summary>
/// <param name="Id">The ingredient id.</param>
/// <param name="Name">The ingredient name.</param>
/// <param name="Before">The quantity before planning.</param>
/// <param name="Used">The quantity used by the plan.</param>
/// <param name="Left">The quantity remaining after planning.</param>
public sealed record IngredientPlanUsageResponse(
    string Id,
    string Name,
    int Before,
    int Used,
    int Left);

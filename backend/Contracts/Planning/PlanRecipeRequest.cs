namespace MealOptimiser.Api.Contracts.Planning;

/// <summary>
/// A recipe supplied to the planner.
/// </summary>
/// <param name="Id">The recipe id.</param>
/// <param name="Name">The recipe name.</param>
/// <param name="Servings">The servings produced by one dish.</param>
/// <param name="Image">The recipe image URL.</param>
/// <param name="Ingredients">Ingredient ids mapped to required quantities.</param>
public sealed record PlanRecipeRequest(
    string Id,
    string Name,
    int Servings,
    string Image,
    IReadOnlyDictionary<string, int> Ingredients);

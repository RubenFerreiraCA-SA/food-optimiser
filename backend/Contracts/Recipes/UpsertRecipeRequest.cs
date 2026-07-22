namespace MealOptimiser.Api.Contracts.Recipes;

/// <summary>
/// The payload for creating or updating a personal recipe.
/// </summary>
/// <param name="Name">The recipe name.</param>
/// <param name="Servings">The number of servings.</param>
/// <param name="Image">The recipe image URL.</param>
/// <param name="Ingredients">Ingredient ids mapped to required quantities.</param>
/// <param name="SourceRecipeId">The shared recipe id this recipe was forked from, when applicable.</param>
public sealed record UpsertRecipeRequest(
    string Name,
    int Servings,
    string Image,
    IReadOnlyDictionary<string, int> Ingredients,
    string? SourceRecipeId);

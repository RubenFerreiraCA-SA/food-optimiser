namespace MealOptimiser.Api.Contracts.Recipes;

/// <summary>
/// A recipe returned to the client.
/// </summary>
/// <param name="Id">The recipe id.</param>
/// <param name="Name">The recipe name.</param>
/// <param name="Servings">The number of servings.</param>
/// <param name="Image">The recipe image URL.</param>
/// <param name="Ingredients">Ingredient ids mapped to required quantities.</param>
/// <param name="Origin">Indicates whether the recipe is shared or personal.</param>
/// <param name="SourceRecipeId">The shared recipe id this recipe was forked from, when applicable.</param>
public sealed record RecipeResponse(
    string Id,
    string Name,
    int Servings,
    string Image,
    IReadOnlyDictionary<string, int> Ingredients,
    string Origin,
    string? SourceRecipeId);

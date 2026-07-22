namespace MealOptimiser.Api.Contracts.Recipes;

public sealed record RecipeResponse(
    string Id,
    string Name,
    int Servings,
    string Image,
    IReadOnlyDictionary<string, int> Ingredients,
    string Origin,
    string? SourceRecipeId);

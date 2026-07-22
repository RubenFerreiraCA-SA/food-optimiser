namespace MealOptimiser.Api.Domain.Recipes;

public sealed record RecipeDocument(
    string Name,
    int Servings,
    string Image,
    IReadOnlyDictionary<string, int> Ingredients,
    string? Origin = null,
    string? SourceRecipeId = null);

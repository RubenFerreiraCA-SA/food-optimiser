namespace MealOptimiser.Api.Contracts.Ingredients;

/// <summary>
/// The payload for creating a shared ingredient.
/// </summary>
/// <param name="Name">The ingredient name.</param>
/// <param name="Image">The ingredient image URL.</param>
public sealed record CreateIngredientRequest(
    string Name,
    string? Image);

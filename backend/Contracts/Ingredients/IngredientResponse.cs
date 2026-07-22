namespace MealOptimiser.Api.Contracts.Ingredients;

/// <summary>
/// A shared ingredient returned to the client.
/// </summary>
/// <param name="Id">The ingredient id.</param>
/// <param name="Name">The ingredient name.</param>
/// <param name="Image">The ingredient image URL.</param>
public sealed record IngredientResponse(
    string Id,
    string Name,
    string Image);

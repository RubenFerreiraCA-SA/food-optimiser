namespace MealOptimiser.Api.Contracts.Ingredients;

public sealed record IngredientResponse(
    string Id,
    string Name,
    string Image);

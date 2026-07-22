namespace MealOptimiser.Api.Domain.Users;

public sealed record UserRecipeSelectionDocument(
    IReadOnlyCollection<string> Values);

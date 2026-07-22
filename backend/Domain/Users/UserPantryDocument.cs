namespace MealOptimiser.Api.Domain.Users;

public sealed record UserPantryDocument(
    IReadOnlyDictionary<string, int> Values);

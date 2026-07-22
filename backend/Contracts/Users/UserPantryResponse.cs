namespace MealOptimiser.Api.Contracts.Users;

public sealed record UserPantryResponse(
    IReadOnlyDictionary<string, int> Values);

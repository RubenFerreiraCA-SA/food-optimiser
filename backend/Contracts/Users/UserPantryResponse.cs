namespace MealOptimiser.Api.Contracts.Users;

/// <summary>
/// Pantry quantities keyed by ingredient id.
/// </summary>
/// <param name="Values">Ingredient quantities for the current user.</param>
public sealed record UserPantryResponse(
    IReadOnlyDictionary<string, int> Values);

namespace MealOptimiser.Api.Contracts.Users;

/// <summary>
/// The payload for replacing the user's pantry quantities.
/// </summary>
/// <param name="Values">Ingredient quantities keyed by ingredient id.</param>
public sealed record UpdatePantryRequest(
    IReadOnlyDictionary<string, int> Values);

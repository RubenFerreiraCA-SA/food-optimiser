namespace MealOptimiser.Api.Contracts.Users;

/// <summary>
/// The payload for replacing the user's selected menu recipe ids.
/// </summary>
/// <param name="Values">The selected recipe ids.</param>
public sealed record UpdateMenuRequest(
    IReadOnlyCollection<string> Values);

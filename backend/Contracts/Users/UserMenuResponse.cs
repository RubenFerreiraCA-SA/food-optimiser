namespace MealOptimiser.Api.Contracts.Users;

/// <summary>
/// The user's selected recipe ids.
/// </summary>
/// <param name="SelectedRecipeIds">Selected recipe identifiers in the user's menu.</param>
public sealed record UserMenuResponse(
    IReadOnlyCollection<string> SelectedRecipeIds);

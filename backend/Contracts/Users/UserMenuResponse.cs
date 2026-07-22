namespace MealOptimiser.Api.Contracts.Users;

public sealed record UserMenuResponse(
    IReadOnlyCollection<string> SelectedRecipeIds);

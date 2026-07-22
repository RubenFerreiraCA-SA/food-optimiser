namespace MealOptimiser.Api.Contracts.Planning;

/// <summary>
/// A pantry ingredient supplied to the planner.
/// </summary>
/// <param name="Id">The ingredient id.</param>
/// <param name="Name">The ingredient name.</param>
/// <param name="Quantity">The ingredient quantity available.</param>
public sealed record PlannerIngredientRequest(
    string Id,
    string Name,
    int Quantity);

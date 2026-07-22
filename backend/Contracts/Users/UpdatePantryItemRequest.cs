namespace MealOptimiser.Api.Contracts.Users;

/// <summary>
/// The payload for adding or setting a single pantry ingredient quantity.
/// </summary>
/// <param name="Quantity">The target quantity for the ingredient.</param>
public sealed record UpdatePantryItemRequest(
    int Quantity);

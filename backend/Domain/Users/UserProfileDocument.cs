namespace MealOptimiser.Api.Domain.Users;

public sealed record UserProfileDocument(
    string Uid,
    string DisplayName,
    string? Email,
    string? PhotoURL,
    string? ProviderId,
    string CreatedAt,
    string UpdatedAt);

namespace MealOptimiser.Api.Contracts.Users;

public sealed record UserProfileResponse(
    string Uid,
    string DisplayName,
    string? Email,
    string? PhotoURL,
    string? ProviderId,
    string CreatedAt,
    string UpdatedAt);

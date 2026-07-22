namespace MealOptimiser.Api.Contracts.Users;

/// <summary>
/// Public profile data returned for the current user.
/// </summary>
/// <param name="Uid">The user id.</param>
/// <param name="DisplayName">The display name shown in the UI.</param>
/// <param name="Email">The user's email address, if present.</param>
/// <param name="PhotoURL">The user's photo URL, if present.</param>
/// <param name="ProviderId">The identity provider id, if present.</param>
/// <param name="CreatedAt">UTC timestamp when the profile was created.</param>
/// <param name="UpdatedAt">UTC timestamp when the profile was last updated.</param>
public sealed record UserProfileResponse(
    string Uid,
    string DisplayName,
    string? Email,
    string? PhotoURL,
    string? ProviderId,
    string CreatedAt,
    string UpdatedAt);

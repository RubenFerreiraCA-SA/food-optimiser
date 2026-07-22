using MealOptimiser.Api.Contracts.Users;
using MealOptimiser.Api.Infrastructure.UserContext;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

/// <summary>
/// Operations for the current user's profile.
/// </summary>
[ApiController]
[Tags("User Profile")]
[Route("api/profile")]
public sealed class ProfileController(
    ICurrentUserAccessor currentUser,
    IReadOnlyAppStateService readOnlyAppState) : ControllerBase
{
    /// <summary>
    /// Returns the current user's profile.
    /// </summary>
    /// <remarks>
    /// Uses the authenticated user id, or the temporary <c>X-User-Id</c> header in local development.
    /// </remarks>
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet]
    public async Task<ActionResult<UserProfileResponse>> GetProfile(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var profile = await readOnlyAppState.GetProfileAsync(userId, cancellationToken);
        return profile is null ? NotFound() : Ok(profile);
    }
}

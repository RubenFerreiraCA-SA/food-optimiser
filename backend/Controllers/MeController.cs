using MealOptimiser.Api.Infrastructure.UserContext;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

[ApiController]
[Route("api/me")]
public sealed class MeController(
    ICurrentUserAccessor currentUser,
    IReadOnlyAppStateService appState) : ControllerBase
{
    /// <summary>
    /// Returns the current user's profile.
    /// </summary>
    /// <remarks>
    /// Uses the authenticated user id, or the temporary <c>X-User-Id</c> header in local development.
    /// </remarks>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var profile = await appState.GetProfileAsync(userId, cancellationToken);
        return profile is null ? NotFound() : Ok(profile);
    }

    /// <summary>
    /// Returns the current user's pantry quantities.
    /// </summary>
    /// <remarks>
    /// The pantry represents the user's ingredient balances.
    /// </remarks>
    [HttpGet("pantry")]
    public async Task<IActionResult> GetPantry(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var pantry = await appState.GetPantryAsync(userId, cancellationToken);
        return pantry is null ? NotFound() : Ok(pantry);
    }

    /// <summary>
    /// Returns the current user's selected menu recipe ids.
    /// </summary>
    [HttpGet("menu")]
    public async Task<IActionResult> GetMenu(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var menu = await appState.GetMenuAsync(userId, cancellationToken);
        return menu is null ? NotFound() : Ok(menu);
    }
}

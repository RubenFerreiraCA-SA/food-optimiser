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
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var profile = await appState.GetProfileAsync(userId, cancellationToken);
        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpGet("pantry")]
    public async Task<IActionResult> GetPantry(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var pantry = await appState.GetPantryAsync(userId, cancellationToken);
        return pantry is null ? NotFound() : Ok(pantry);
    }

    [HttpGet("menu")]
    public async Task<IActionResult> GetMenu(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var menu = await appState.GetMenuAsync(userId, cancellationToken);
        return menu is null ? NotFound() : Ok(menu);
    }
}

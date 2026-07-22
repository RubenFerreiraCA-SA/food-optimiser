using MealOptimiser.Api.Contracts.Users;
using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Infrastructure.UserContext;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

[ApiController]
[Tags("Me")]
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
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet("profile")]
    public async Task<ActionResult<UserProfileResponse>> GetProfile(CancellationToken cancellationToken)
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
    [ProducesResponseType(typeof(UserPantryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet("pantry")]
    public async Task<ActionResult<UserPantryResponse>> GetPantry(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var pantry = await appState.GetPantryAsync(userId, cancellationToken);
        return pantry is null ? NotFound() : Ok(pantry);
    }

    /// <summary>
    /// Returns the current user's selected menu recipe ids.
    /// </summary>
    [ProducesResponseType(typeof(UserMenuResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet("menu/ids")]
    public async Task<ActionResult<UserMenuResponse>> GetMenu(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var menu = await appState.GetMenuAsync(userId, cancellationToken);
        return menu is null ? NotFound() : Ok(menu);
    }

    /// <summary>
    /// Returns the user's full menu as a combined list of shared and personal recipes.
    /// </summary>
    [HttpGet("menu/all")]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetAllMenuRecipes(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var recipes = await appState.GetAllMenuRecipesAsync(userId, cancellationToken);
        return Ok(recipes);
    }

    /// <summary>
    /// Returns the user's personal recipe forks and custom recipes that are on the menu.
    /// </summary>
    [HttpGet("menu/personal-recipes")]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetPersonalRecipes(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var recipes = await appState.GetPersonalRecipesAsync(userId, cancellationToken);
        return Ok(recipes);
    }

    /// <summary>
    /// Returns the shared recipes the user has added to their menu.
    /// </summary>
    [HttpGet("menu/shared-recipes")]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetSharedRecipes(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var recipes = await appState.GetSharedRecipesAsync(userId, cancellationToken);
        return Ok(recipes);
    }
}

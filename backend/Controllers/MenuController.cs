using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Infrastructure.UserContext;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

[ApiController]
[Route("api/menu")]
public sealed class MenuController(
    ICurrentUserAccessor currentUser,
    IReadOnlyAppStateService appState) : ControllerBase
{
    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var recipes = await appState.GetAllMenuRecipesAsync(userId, cancellationToken);
        return Ok(recipes);
    }

    [HttpGet("personal-recipes")]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetPersonal(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var recipes = await appState.GetPersonalRecipesAsync(userId, cancellationToken);
        return Ok(recipes);
    }

    [HttpGet("shared-recipes")]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetShared(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var recipes = await appState.GetSharedRecipesAsync(userId, cancellationToken);
        return Ok(recipes);
    }
}

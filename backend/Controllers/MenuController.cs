using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Contracts.Users;
using MealOptimiser.Api.Infrastructure.UserContext;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

/// <summary>
/// Operations for the current user's menu and personal recipe forks.
/// </summary>
[ApiController]
[Tags("User Menu")]
[Route("api/menu")]
public sealed class MenuController(
    ICurrentUserAccessor currentUser,
    IReadOnlyAppStateService readOnlyAppState,
    IAppStateWriteService writeState) : ControllerBase
{
    /// <summary>
    /// Returns the current user's selected menu recipe ids.
    /// </summary>
    [ProducesResponseType(typeof(UserMenuResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet]
    public async Task<ActionResult<UserMenuResponse>> GetMenu(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var menu = await readOnlyAppState.GetMenuAsync(userId, cancellationToken);
        return menu is null ? NotFound() : Ok(menu);
    }

    /// <summary>
    /// Returns the user's full menu as a combined list of shared and personal recipes.
    /// </summary>
    [ProducesResponseType(typeof(IReadOnlyList<RecipeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetAllMenuRecipes(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var recipes = await readOnlyAppState.GetAllMenuRecipesAsync(userId, cancellationToken);
        return Ok(recipes);
    }

    /// <summary>
    /// Returns the user's personal recipe forks and custom recipes that are on the menu.
    /// </summary>
    [ProducesResponseType(typeof(IReadOnlyList<RecipeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpGet("personal-recipes")]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetPersonalRecipes(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var recipes = await readOnlyAppState.GetPersonalRecipesAsync(userId, cancellationToken);
        return Ok(recipes);
    }

    /// <summary>
    /// Returns the shared recipes the user has added to their menu.
    /// </summary>
    [ProducesResponseType(typeof(IReadOnlyList<RecipeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpGet("shared-recipes")]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetSharedRecipes(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var recipes = await readOnlyAppState.GetSharedRecipesAsync(userId, cancellationToken);
        return Ok(recipes);
    }

    /// <summary>
    /// Replaces the current user's selected menu recipe ids.
    /// </summary>
    [ProducesResponseType(typeof(UserMenuResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpPut]
    public async Task<ActionResult<UserMenuResponse>> ReplaceMenu(
        [FromBody] UpdateMenuRequest request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var menu = await writeState.ReplaceMenuAsync(userId, request.Values, cancellationToken);
        return Ok(menu);
    }

    /// <summary>
    /// Adds a recipe id to the current user's menu.
    /// </summary>
    [ProducesResponseType(typeof(UserMenuResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpPost("{recipeId}")]
    public async Task<ActionResult<UserMenuResponse>> AddMenuRecipe(
        string recipeId,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var menu = await writeState.AddMenuRecipeAsync(userId, recipeId, cancellationToken);
        return Ok(menu);
    }

    /// <summary>
    /// Removes a recipe id from the current user's menu.
    /// </summary>
    [ProducesResponseType(typeof(UserMenuResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpDelete("{recipeId}")]
    public async Task<ActionResult<UserMenuResponse>> RemoveMenuRecipe(
        string recipeId,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var menu = await writeState.RemoveMenuRecipeAsync(userId, recipeId, cancellationToken);
        return Ok(menu);
    }

    /// <summary>
    /// Creates a new personal recipe for the current user.
    /// </summary>
    [ProducesResponseType(typeof(RecipeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpPost("personal-recipes")]
    public async Task<ActionResult<RecipeResponse>> CreatePersonalRecipe(
        [FromBody] UpsertRecipeRequest request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Name) || request.Servings < 1)
        {
            return BadRequest();
        }

        var recipe = await writeState.CreatePersonalRecipeAsync(userId, request, cancellationToken);
        return Ok(recipe);
    }

    /// <summary>
    /// Updates an existing personal recipe.
    /// </summary>
    [ProducesResponseType(typeof(RecipeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpPut("personal-recipes/{recipeId}")]
    public async Task<ActionResult<RecipeResponse>> UpdatePersonalRecipe(
        string recipeId,
        [FromBody] UpsertRecipeRequest request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Name) || request.Servings < 1)
        {
            return BadRequest();
        }

        var recipe = await writeState.UpdatePersonalRecipeAsync(userId, recipeId, request, cancellationToken);
        return recipe is null ? NotFound() : Ok(recipe);
    }

    /// <summary>
    /// Deletes a personal recipe from the current user.
    /// </summary>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpDelete("personal-recipes/{recipeId}")]
    public async Task<ActionResult> DeletePersonalRecipe(
        string recipeId,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var deleted = await writeState.DeletePersonalRecipeAsync(userId, recipeId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}

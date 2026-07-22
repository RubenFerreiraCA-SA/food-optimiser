using MealOptimiser.Api.Contracts.Users;
using MealOptimiser.Api.Infrastructure.UserContext;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

/// <summary>
/// Operations for the current user's pantry.
/// </summary>
[ApiController]
[Tags("Pantry")]
[Route("api/pantry")]
public sealed class PantryController(
    ICurrentUserAccessor currentUser,
    IReadOnlyAppStateService readOnlyAppState,
    IAppStateWriteService writeState) : ControllerBase
{
    /// <summary>
    /// Returns the current user's pantry quantities.
    /// </summary>
    /// <remarks>
    /// The pantry represents the user's ingredient balances.
    /// </remarks>
    [ProducesResponseType(typeof(UserPantryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet]
    public async Task<ActionResult<UserPantryResponse>> GetPantry(CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var pantry = await readOnlyAppState.GetPantryAsync(userId, cancellationToken);
        return pantry is null ? NotFound() : Ok(pantry);
    }

    /// <summary>
    /// Replaces the current user's pantry quantities.
    /// </summary>
    [ProducesResponseType(typeof(UserPantryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpPut]
    public async Task<ActionResult<UserPantryResponse>> ReplacePantry(
        [FromBody] UpdatePantryRequest request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var pantry = await writeState.ReplacePantryAsync(userId, request.Values, cancellationToken);
        return Ok(pantry);
    }

    /// <summary>
    /// Adds an ingredient quantity to the current user's pantry.
    /// </summary>
    [ProducesResponseType(typeof(UserPantryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpPost("{ingredientId}")]
    public async Task<ActionResult<UserPantryResponse>> AddPantryIngredient(
        string ingredientId,
        [FromBody] UpdatePantryItemRequest request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        if (request.Quantity < 1) return BadRequest();

        var pantry = await writeState.AddPantryIngredientAsync(userId, ingredientId, request.Quantity, cancellationToken);
        return Ok(pantry);
    }

    /// <summary>
    /// Sets the quantity for a single ingredient in the current user's pantry.
    /// </summary>
    [ProducesResponseType(typeof(UserPantryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpPut("{ingredientId}")]
    public async Task<ActionResult<UserPantryResponse>> SetPantryIngredient(
        string ingredientId,
        [FromBody] UpdatePantryItemRequest request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        if (request.Quantity < 0) return BadRequest();

        var pantry = await writeState.SetPantryIngredientAsync(userId, ingredientId, request.Quantity, cancellationToken);
        return Ok(pantry);
    }

    /// <summary>
    /// Removes an ingredient from the current user's pantry.
    /// </summary>
    [ProducesResponseType(typeof(UserPantryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [HttpDelete("{ingredientId}")]
    public async Task<ActionResult<UserPantryResponse>> RemovePantryIngredient(
        string ingredientId,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var pantry = await writeState.RemovePantryIngredientAsync(userId, ingredientId, cancellationToken);
        return Ok(pantry);
    }
}

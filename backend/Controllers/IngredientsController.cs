using MealOptimiser.Api.Contracts.Ingredients;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

/// <summary>
/// Operations for the shared ingredient catalog.
/// </summary>
[ApiController]
[Tags("Ingredients")]
[Route("api/ingredients")]
public sealed class IngredientsController(
    IReadOnlyAppStateService readOnlyAppState,
    IAppStateWriteService writeState) : ControllerBase
{
    /// <summary>
    /// Returns the global ingredient catalog.
    /// </summary>
    [ProducesResponseType(typeof(IReadOnlyList<IngredientResponse>), StatusCodes.Status200OK)]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<IngredientResponse>>> GetIngredients(CancellationToken cancellationToken)
    {
        var ingredients = await readOnlyAppState.GetIngredientsAsync(cancellationToken);
        return Ok(ingredients);
    }

    /// <summary>
    /// Returns a shared ingredient by id.
    /// </summary>
    [ProducesResponseType(typeof(IngredientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet("{ingredientId}")]
    public async Task<ActionResult<IngredientResponse>> GetIngredient(string ingredientId, CancellationToken cancellationToken)
    {
        var ingredient = await readOnlyAppState.GetIngredientAsync(ingredientId, cancellationToken);
        return ingredient is null ? NotFound() : Ok(ingredient);
    }

    /// <summary>
    /// Creates a new shared ingredient if one does not already exist.
    /// </summary>
    [ProducesResponseType(typeof(IngredientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [HttpPost]
    public async Task<ActionResult<IngredientResponse>> CreateIngredient(
        [FromBody] CreateIngredientRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest();
        }

        var ingredient = await writeState.CreateIngredientAsync(request, cancellationToken);
        return Ok(ingredient);
    }
}

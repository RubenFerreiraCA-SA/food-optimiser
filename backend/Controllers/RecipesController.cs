using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

/// <summary>
/// Operations for the global shared recipe catalog.
/// </summary>
[ApiController]
[Tags("Recipes")]
[Route("api/recipes")]
public sealed class RecipesController(
    IReadOnlyAppStateService readOnlyAppState,
    IAppStateWriteService writeState) : ControllerBase
{
    /// <summary>
    /// Returns the global shared recipe catalog.
    /// </summary>
    [ProducesResponseType(typeof(IReadOnlyList<RecipeResponse>), StatusCodes.Status200OK)]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetRecipes(CancellationToken cancellationToken)
    {
        var recipes = await readOnlyAppState.GetRecipeCatalogAsync(cancellationToken);
        return Ok(recipes);
    }

    /// <summary>
    /// Returns a shared recipe by id.
    /// </summary>
    [ProducesResponseType(typeof(RecipeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet("{recipeId}")]
    public async Task<ActionResult<RecipeResponse>> GetRecipe(string recipeId, CancellationToken cancellationToken)
    {
        var recipe = await readOnlyAppState.GetRecipeAsync(recipeId, cancellationToken);
        return recipe is null ? NotFound() : Ok(recipe);
    }

    /// <summary>
    /// Creates a new shared recipe in the global catalog.
    /// </summary>
    [ProducesResponseType(typeof(RecipeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [HttpPost]
    public async Task<ActionResult<RecipeResponse>> CreateRecipe(
        [FromBody] UpsertRecipeRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Servings < 1)
        {
            return BadRequest();
        }

        var recipe = await writeState.CreateGlobalRecipeAsync(request, cancellationToken);
        return Ok(recipe);
    }
}

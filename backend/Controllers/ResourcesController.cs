using MealOptimiser.Api.Contracts.Ingredients;
using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

[ApiController]
[Route("api/resources")]
public sealed class ResourcesController(IReadOnlyAppStateService appState) : ControllerBase
{
    /// <summary>
    /// Returns the global ingredient catalog.
    /// </summary>
    [HttpGet("ingredients")]
    public async Task<ActionResult<IReadOnlyList<IngredientResponse>>> GetIngredients(CancellationToken cancellationToken)
    {
        var ingredients = await appState.GetIngredientsAsync(cancellationToken);
        return Ok(ingredients);
    }

    /// <summary>
    /// Returns the global shared recipe catalog.
    /// </summary>
    [HttpGet("recipes")]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> GetRecipes(CancellationToken cancellationToken)
    {
        var recipes = await appState.GetRecipeCatalogAsync(cancellationToken);
        return Ok(recipes);
    }
}

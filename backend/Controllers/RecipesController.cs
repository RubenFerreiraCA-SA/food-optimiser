using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

[ApiController]
[Route("api/recipes")]
public sealed class RecipesController(IReadOnlyAppStateService appState) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RecipeResponse>>> Get(CancellationToken cancellationToken)
    {
        var recipes = await appState.GetRecipeCatalogAsync(cancellationToken);
        return Ok(recipes);
    }
}

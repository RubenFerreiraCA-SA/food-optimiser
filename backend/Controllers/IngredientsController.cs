using MealOptimiser.Api.Contracts.Ingredients;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

[ApiController]
[Route("api/ingredients")]
public sealed class IngredientsController(IReadOnlyAppStateService appState) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<IngredientResponse>>> Get(CancellationToken cancellationToken)
    {
        var ingredients = await appState.GetIngredientsAsync(cancellationToken);
        return Ok(ingredients);
    }
}

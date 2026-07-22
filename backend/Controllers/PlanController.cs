using MealOptimiser.Api.Contracts.Planning;
using MealOptimiser.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MealOptimiser.Api.Controllers;

/// <summary>
/// Operations for generating an optimised meal plan.
/// </summary>
[ApiController]
[Tags("Plan")]
[Route("api/plan")]
public sealed class PlanController(IPlannerService planner) : ControllerBase
{
    /// <summary>
    /// Generates the best whole-dish meal plan for the provided ingredients and recipes.
    /// </summary>
    [ProducesResponseType(typeof(OptimisedPlanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [HttpPost]
    public async Task<ActionResult<OptimisedPlanResponse>> CreatePlan(
        [FromBody] PlanRequest request,
        CancellationToken cancellationToken)
    {
        if (request.AvailableIngredients is null || request.Recipes is null)
        {
            return BadRequest();
        }

        var plan = await planner.OptimiseAsync(request, cancellationToken);
        return Ok(plan);
    }
}

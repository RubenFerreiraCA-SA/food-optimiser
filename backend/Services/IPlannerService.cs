using MealOptimiser.Api.Contracts.Planning;

namespace MealOptimiser.Api.Services;

public interface IPlannerService
{
    Task<OptimisedPlanResponse> OptimiseAsync(PlanRequest request, CancellationToken cancellationToken = default);
}

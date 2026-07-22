namespace MealOptimiser.Api.Infrastructure.UserContext;

public interface ICurrentUserAccessor
{
    string? GetUserId();
}

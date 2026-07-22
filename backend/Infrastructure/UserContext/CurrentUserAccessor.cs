using System.Security.Claims;

namespace MealOptimiser.Api.Infrastructure.UserContext;

public sealed class CurrentUserAccessor(IHttpContextAccessor httpContextAccessor) : ICurrentUserAccessor
{
    private const string UserIdHeader = "X-User-Id";

    public string? GetUserId()
    {
        var context = httpContextAccessor.HttpContext;
        if (context is null) return null;

        var claim =
            context.User.FindFirst("uid")?.Value
            ?? context.User.FindFirst("user_id")?.Value
            ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? context.User.FindFirst("sub")?.Value;
        if (!string.IsNullOrWhiteSpace(claim)) return claim;

        return context.Request.Headers.TryGetValue(UserIdHeader, out var header)
            ? header.ToString()
            : null;
    }
}

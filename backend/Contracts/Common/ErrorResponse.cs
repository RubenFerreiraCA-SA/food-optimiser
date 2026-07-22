namespace MealOptimiser.Api.Contracts.Common;

/// <summary>
/// Standard error payload used in Swagger documentation.
/// </summary>
/// <param name="Message">Human-readable error message.</param>
/// <param name="Code">Optional machine-readable error code.</param>
/// <param name="Details">Optional extra error details.</param>
public sealed record ErrorResponse(
    string Message,
    string? Code = null,
    string? Details = null);

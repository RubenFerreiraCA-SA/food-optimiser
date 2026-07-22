using Google.Api.Gax;
using Google.Cloud.Firestore;
using Microsoft.Extensions.Options;
using MealOptimiser.Api.Infrastructure.Configuration;
using MealOptimiser.Api.Infrastructure.Firestore;
using MealOptimiser.Api.Infrastructure.UserContext;
using MealOptimiser.Api.Services;

namespace MealOptimiser.Api.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddMealOptimiserBackend(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services
            .AddControllers()
            .Services
            .AddEndpointsApiExplorer()
            .AddSwaggerGen()
            .AddHttpContextAccessor()
            .AddOptions<FirebaseOptions>()
            .Bind(configuration.GetSection(FirebaseOptions.SectionName))
            .PostConfigure(options =>
            {
                if (!options.UseFirestoreEmulator) return;

                if (string.IsNullOrWhiteSpace(options.FirestoreEmulatorHost))
                {
                    throw new InvalidOperationException(
                        "Firebase:FirestoreEmulatorHost must be configured when Firebase:UseFirestoreEmulator is enabled.");
                }

                if (string.IsNullOrWhiteSpace(
                    Environment.GetEnvironmentVariable(FirebaseOptions.FirestoreEmulatorHostEnvironmentVariable)))
                {
                    Environment.SetEnvironmentVariable(
                        FirebaseOptions.FirestoreEmulatorHostEnvironmentVariable,
                        options.FirestoreEmulatorHost);
                }
            })
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.ProjectId),
                "Firebase:ProjectId must be configured.");

        services.AddSingleton(sp =>
        {
            var options = sp.GetRequiredService<IOptions<FirebaseOptions>>().Value;
            return new FirestoreDbBuilder
            {
                ProjectId = options.ProjectId,
                EmulatorDetection = EmulatorDetection.EmulatorOrProduction,
            }.Build();
        });

        services.AddSingleton<IFirestoreDbAccessor, FirestoreDbAccessor>();
        services.AddSingleton<ICurrentUserAccessor, CurrentUserAccessor>();
        services.AddSingleton<IReadOnlyAppStateService, FirestoreReadOnlyAppStateService>();

        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                var frontendOrigins = configuration
                    .GetSection(FirebaseOptions.SectionName)
                    .Get<FirebaseOptions>()?.FrontendOrigins
                    ?? FirebaseOptions.DefaultFrontendOrigins;

                policy
                    .WithOrigins(frontendOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        return services;
    }
}

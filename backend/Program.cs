using MealOptimiser.Api.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);

builder.Services.AddMealOptimiserBackend(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsEnvironment("Local"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.MapControllers();

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "ok",
        timestampUtc = DateTimeOffset.UtcNow,
    });
});

app.MapGet("/api/info", (IHostEnvironment environment, Google.Cloud.Firestore.FirestoreDb firestoreDb) =>
{
    return Results.Ok(new
    {
        name = "Meal Optimiser API",
        environment = environment.EnvironmentName,
        version = "1.0.0",
        firestore = new
        {
            projectId = firestoreDb.ProjectId,
            mode = Environment.GetEnvironmentVariable("FIRESTORE_EMULATOR_HOST") is null ? "production" : "emulator",
        },
    });
});

app.Run();

public partial class Program;

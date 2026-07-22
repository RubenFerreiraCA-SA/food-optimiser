using Google.Api.Gax;
using Google.Cloud.Firestore;

var builder = WebApplication.CreateBuilder(args);

var firestoreProjectId = builder.Configuration["Firestore:ProjectId"];
if (string.IsNullOrWhiteSpace(firestoreProjectId))
{
  throw new InvalidOperationException("Firestore:ProjectId must be configured.");
}

if (builder.Environment.IsDevelopment() &&
    string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("FIRESTORE_EMULATOR_HOST")))
{
  throw new InvalidOperationException(
    "FIRESTORE_EMULATOR_HOST must be set in Development to use the Firestore emulator.");
}

var firestore = new FirestoreDbBuilder
{
  ProjectId = firestoreProjectId,
  EmulatorDetection = EmulatorDetection.EmulatorOrProduction,
}.Build();

builder.Services.AddSingleton(firestore);

builder.Services.AddCors(options =>
{
  options.AddPolicy("Frontend", policy =>
  {
    policy
      .WithOrigins(
        "http://localhost:4200",
        "http://127.0.0.1:4200"
      )
      .AllowAnyHeader()
      .AllowAnyMethod();
  });
});

var app = builder.Build();

app.UseCors("Frontend");

var api = app.MapGroup("/api");

api.MapGet("/health", () =>
{
  return Results.Ok(new
  {
    status = "ok",
    timestampUtc = DateTimeOffset.UtcNow,
  });
});

api.MapGet("/info", (IHostEnvironment environment, FirestoreDb firestoreDb) =>
{
  return Results.Ok(new
  {
    name = "Meal Optimiser API",
    environment = environment.EnvironmentName,
    version = "1.0.0",
    firestore = new
    {
      projectId = firestoreDb.ProjectId,
      mode = environment.IsDevelopment() ? "emulator" : "production",
    },
  });
});

app.Run();

public partial class Program;

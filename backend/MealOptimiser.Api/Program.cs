using Google.Api.Gax;
using Google.Cloud.Firestore;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);

var firestoreProjectId = builder.Configuration["Firestore:ProjectId"];
if (string.IsNullOrWhiteSpace(firestoreProjectId))
{
  throw new InvalidOperationException("Firestore:ProjectId must be configured.");
}

var useFirestoreEmulator = builder.Configuration.GetValue<bool>("Firestore:UseEmulator");
if (useFirestoreEmulator &&
    string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("FIRESTORE_EMULATOR_HOST")))
{
  throw new InvalidOperationException(
    "FIRESTORE_EMULATOR_HOST must be set when Firestore:UseEmulator is enabled.");
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
      mode = useFirestoreEmulator ? "emulator" : "production",
    },
  });
});

app.Run();

public partial class Program;

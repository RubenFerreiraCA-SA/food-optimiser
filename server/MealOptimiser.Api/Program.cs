var builder = WebApplication.CreateBuilder(args);

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

api.MapGet("/info", (IHostEnvironment environment) =>
{
  return Results.Ok(new
  {
    name = "Meal Optimiser API",
    environment = environment.EnvironmentName,
    version = "1.0.0",
  });
});

app.Run();

public partial class Program;

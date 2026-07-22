using MealOptimiser.Api.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);

builder.Services.AddMealOptimiserBackend(builder.Configuration);

var app = builder.Build();

app.UseCors("Frontend");

app.Run();

public partial class Program;

using MealOptimiser.Api.Controllers;
using MealOptimiser.Api.Contracts.Common;
using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Contracts.Users;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace MealOptimiser.Api.Infrastructure.Swagger;

public sealed class ProfileResponseExampleOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        EnsureResponse(operation, context, "401", "Error response", "Authentication is required.", "UNAUTHORIZED", replaceContent: true);
        EnsureResponse(operation, context, "404", "Error response", "The requested resource was not found.", "NOT_FOUND", replaceContent: true);
        EnsureResponse(operation, context, "400", "Error response", "The request could not be processed.", "BAD_REQUEST");
        EnsureResponse(operation, context, "500", "Error response", "An unexpected server error occurred.", "SERVER_ERROR");

        if (!operation.Responses.TryGetValue("200", out var response))
        {
            return;
        }

        if (!response.Content.TryGetValue("application/json", out var mediaType))
        {
            return;
        }

        mediaType.Example = context.MethodInfo.Name switch
        {
            nameof(ProfileController.GetProfile) => new OpenApiObject
            {
                ["uid"] = new OpenApiString("user_1234abcd"),
                ["displayName"] = new OpenApiString("Ruben"),
                ["email"] = new OpenApiString("ruben@example.com"),
                ["photoURL"] = new OpenApiString("https://example.com/avatar.png"),
                ["providerId"] = new OpenApiString("password"),
                ["createdAt"] = new OpenApiString("2026-07-22T00:00:00Z"),
                ["updatedAt"] = new OpenApiString("2026-07-22T12:34:56Z"),
            },
            nameof(PantryController.GetPantry) => new OpenApiObject
            {
                ["values"] = new OpenApiObject
                {
                    ["ing_apple_01"] = new OpenApiInteger(4),
                    ["ing_flour_02"] = new OpenApiInteger(2),
                    ["ing_salt_03"] = new OpenApiInteger(1),
                },
            },
            nameof(MenuController.GetMenu) => new OpenApiObject
            {
                ["selectedRecipeIds"] = new OpenApiArray
                {
                    new OpenApiString("rec_pasta_01"),
                    new OpenApiString("rec_soup_02"),
                },
            },
            nameof(PantryController.ReplacePantry) or nameof(PantryController.AddPantryIngredient) or nameof(PantryController.SetPantryIngredient) or nameof(PantryController.RemovePantryIngredient) => new OpenApiObject
            {
                ["values"] = new OpenApiObject
                {
                    ["ing_apple_01"] = new OpenApiInteger(4),
                    ["ing_flour_02"] = new OpenApiInteger(2),
                    ["ing_salt_03"] = new OpenApiInteger(1),
                },
            },
            nameof(MenuController.ReplaceMenu) or nameof(MenuController.AddMenuRecipe) or nameof(MenuController.RemoveMenuRecipe) => new OpenApiObject
            {
                ["selectedRecipeIds"] = new OpenApiArray
                {
                    new OpenApiString("rec_pasta_01"),
                    new OpenApiString("rec_soup_02"),
                },
            },
            nameof(MenuController.CreatePersonalRecipe) or nameof(MenuController.UpdatePersonalRecipe) => new OpenApiObject
            {
                ["id"] = new OpenApiString("a1b2c3d4"),
                ["name"] = new OpenApiString("Quick Pasta"),
                ["servings"] = new OpenApiInteger(2),
                ["image"] = new OpenApiString("https://example.com/pasta.png"),
                ["ingredients"] = new OpenApiObject
                {
                    ["ing_pasta_01"] = new OpenApiInteger(1),
                    ["ing_sauce_02"] = new OpenApiInteger(1),
                },
                ["origin"] = new OpenApiString("forked"),
                ["sourceRecipeId"] = new OpenApiString("rec_pasta_01"),
            },
            nameof(IngredientsController.GetIngredients) => new OpenApiArray
            {
                new OpenApiObject
                {
                    ["id"] = new OpenApiString("ing_apple_01"),
                    ["name"] = new OpenApiString("Apple"),
                    ["image"] = new OpenApiString("https://example.com/apple.png"),
                },
            },
            nameof(IngredientsController.GetIngredient) or nameof(IngredientsController.CreateIngredient) => new OpenApiObject
            {
                ["id"] = new OpenApiString("ing_apple_01"),
                ["name"] = new OpenApiString("Apple"),
                ["image"] = new OpenApiString("https://example.com/apple.png"),
            },
            nameof(RecipesController.GetRecipes) => new OpenApiArray
            {
                new OpenApiObject
                {
                    ["id"] = new OpenApiString("rec_pasta_01"),
                    ["name"] = new OpenApiString("Pasta"),
                    ["servings"] = new OpenApiInteger(2),
                    ["image"] = new OpenApiString("https://example.com/pasta.png"),
                    ["ingredients"] = new OpenApiObject
                    {
                        ["ing_pasta_01"] = new OpenApiInteger(1),
                    },
                    ["origin"] = new OpenApiString("shared"),
                    ["sourceRecipeId"] = new OpenApiNull(),
                },
            },
            nameof(RecipesController.GetRecipe) => new OpenApiObject
            {
                ["id"] = new OpenApiString("rec_pasta_01"),
                ["name"] = new OpenApiString("Pasta"),
                ["servings"] = new OpenApiInteger(2),
                ["image"] = new OpenApiString("https://example.com/pasta.png"),
                ["ingredients"] = new OpenApiObject
                {
                    ["ing_pasta_01"] = new OpenApiInteger(1),
                },
                ["origin"] = new OpenApiString("shared"),
                ["sourceRecipeId"] = new OpenApiNull(),
            },
            nameof(RecipesController.CreateRecipe) => new OpenApiObject
            {
                ["id"] = new OpenApiString("rec_1a2b3c4d"),
                ["name"] = new OpenApiString("Pasta"),
                ["servings"] = new OpenApiInteger(2),
                ["image"] = new OpenApiString("https://example.com/pasta.png"),
                ["ingredients"] = new OpenApiObject
                {
                    ["ing_pasta_01"] = new OpenApiInteger(1),
                    ["ing_sauce_02"] = new OpenApiInteger(1),
                },
                ["origin"] = new OpenApiString("shared"),
                ["sourceRecipeId"] = new OpenApiNull(),
            },
            _ => mediaType.Example,
        };
    }

    private static void EnsureResponse(
        OpenApiOperation operation,
        OperationFilterContext context,
        string statusCode,
        string description,
        string message,
        string code,
        bool replaceContent = false)
    {
        var schema = context.SchemaGenerator.GenerateSchema(typeof(ErrorResponse), context.SchemaRepository);
        if (!operation.Responses.TryGetValue(statusCode, out var response))
        {
            response = new OpenApiResponse();
            operation.Responses[statusCode] = response;
        }

        response.Description = description;
        if (replaceContent)
        {
            response.Content.Clear();
        }

        response.Content["application/json"] = new OpenApiMediaType
        {
            Schema = schema,
            Example = new OpenApiObject
            {
                ["message"] = new OpenApiString(message),
                ["code"] = new OpenApiString(code),
            },
        };
    }
}

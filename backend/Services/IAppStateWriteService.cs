using MealOptimiser.Api.Contracts.Ingredients;
using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Contracts.Users;

namespace MealOptimiser.Api.Services;

public interface IAppStateWriteService
{
    Task<UserPantryResponse> ReplacePantryAsync(
        string userId,
        IReadOnlyDictionary<string, int> values,
        CancellationToken cancellationToken = default);

    Task<UserPantryResponse> AddPantryIngredientAsync(
        string userId,
        string ingredientId,
        int quantity,
        CancellationToken cancellationToken = default);

    Task<UserPantryResponse> SetPantryIngredientAsync(
        string userId,
        string ingredientId,
        int quantity,
        CancellationToken cancellationToken = default);

    Task<UserPantryResponse> RemovePantryIngredientAsync(
        string userId,
        string ingredientId,
        CancellationToken cancellationToken = default);

    Task<UserMenuResponse> ReplaceMenuAsync(
        string userId,
        IReadOnlyCollection<string> values,
        CancellationToken cancellationToken = default);

    Task<UserMenuResponse> AddMenuRecipeAsync(
        string userId,
        string recipeId,
        CancellationToken cancellationToken = default);

    Task<UserMenuResponse> RemoveMenuRecipeAsync(
        string userId,
        string recipeId,
        CancellationToken cancellationToken = default);

    Task<RecipeResponse> CreatePersonalRecipeAsync(
        string userId,
        UpsertRecipeRequest request,
        CancellationToken cancellationToken = default);

    Task<RecipeResponse?> UpdatePersonalRecipeAsync(
        string userId,
        string recipeId,
        UpsertRecipeRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeletePersonalRecipeAsync(
        string userId,
        string recipeId,
        CancellationToken cancellationToken = default);

    Task<IngredientResponse> CreateIngredientAsync(
        CreateIngredientRequest request,
        CancellationToken cancellationToken = default);

    Task<RecipeResponse> CreateGlobalRecipeAsync(
        UpsertRecipeRequest request,
        CancellationToken cancellationToken = default);
}

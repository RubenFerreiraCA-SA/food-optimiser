using MealOptimiser.Api.Contracts.Ingredients;
using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Contracts.Users;

namespace MealOptimiser.Api.Services;

public interface IReadOnlyAppStateService
{
    Task<UserProfileResponse?> GetProfileAsync(string userId, CancellationToken cancellationToken = default);
    Task<UserPantryResponse?> GetPantryAsync(string userId, CancellationToken cancellationToken = default);
    Task<UserMenuResponse?> GetMenuAsync(string userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecipeResponse>> GetPersonalRecipesAsync(string userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecipeResponse>> GetSharedRecipesAsync(string userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecipeResponse>> GetAllMenuRecipesAsync(string userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<IngredientResponse>> GetIngredientsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RecipeResponse>> GetRecipeCatalogAsync(CancellationToken cancellationToken = default);
}

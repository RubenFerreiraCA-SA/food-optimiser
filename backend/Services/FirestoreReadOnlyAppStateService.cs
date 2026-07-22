using Google.Cloud.Firestore;
using MealOptimiser.Api.Contracts.Ingredients;
using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Contracts.Users;
using MealOptimiser.Api.Infrastructure.Firestore;

namespace MealOptimiser.Api.Services;

public sealed class FirestoreReadOnlyAppStateService(IFirestoreDbAccessor firestore) : IReadOnlyAppStateService
{
    public async Task<UserProfileResponse?> GetProfileAsync(string userId, CancellationToken cancellationToken = default)
    {
        var snapshot = await firestore.Database
            .Collection("users")
            .Document(userId)
            .Collection(FirestoreCollectionNames.UserProfile)
            .Document("main")
            .GetSnapshotAsync(cancellationToken);

        return snapshot.Exists ? MapProfile(snapshot) : null;
    }

    public async Task<UserPantryResponse?> GetPantryAsync(string userId, CancellationToken cancellationToken = default)
    {
        var snapshot = await firestore.Database
            .Collection("users")
            .Document(userId)
            .Collection(FirestoreCollectionNames.UserData)
            .Document(FirestoreCollectionNames.SharedIngredients)
            .GetSnapshotAsync(cancellationToken);

        return snapshot.Exists ? new UserPantryResponse(ReadIntDictionary(snapshot)) : null;
    }

    public async Task<UserMenuResponse?> GetMenuAsync(string userId, CancellationToken cancellationToken = default)
    {
        var snapshot = await firestore.Database
            .Collection("users")
            .Document(userId)
            .Collection(FirestoreCollectionNames.UserData)
            .Document(FirestoreCollectionNames.SharedRecipes)
            .GetSnapshotAsync(cancellationToken);

        return snapshot.Exists ? new UserMenuResponse(ReadStringList(snapshot)) : null;
    }

    public async Task<IReadOnlyList<RecipeResponse>> GetPersonalRecipesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var (selectedIds, selectedSharedIds, personalRecipes, sharedRecipes) =
            await LoadMenuRecipeMapsAsync(userId, cancellationToken);
        var selectedPersonalIds = selectedIds.Where(recipeId => personalRecipes.ContainsKey(recipeId) && !selectedSharedIds.Contains(recipeId));

        return selectedPersonalIds
            .Select(recipeId => personalRecipes.TryGetValue(recipeId, out var recipe) ? recipe : null)
            .Where(recipe => recipe is not null)
            .Select(recipe => recipe!)
            .ToArray();
    }

    public async Task<IReadOnlyList<RecipeResponse>> GetSharedRecipesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var (_, selectedSharedIds, _, sharedRecipes) = await LoadMenuRecipeMapsAsync(userId, cancellationToken);

        return selectedSharedIds
            .Select(recipeId => sharedRecipes.TryGetValue(recipeId, out var recipe) ? recipe : null)
            .Where(recipe => recipe is not null)
            .Select(recipe => recipe!)
            .ToArray();
    }

    public async Task<IReadOnlyList<RecipeResponse>> GetAllMenuRecipesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var (selectedIds, _, personalRecipes, sharedRecipes) = await LoadMenuRecipeMapsAsync(userId, cancellationToken);

        return selectedIds
            .Select(recipeId =>
                personalRecipes.TryGetValue(recipeId, out var personalRecipe)
                    ? personalRecipe
                    : sharedRecipes.TryGetValue(recipeId, out var sharedRecipe)
                        ? sharedRecipe
                        : null)
            .Where(recipe => recipe is not null)
            .Select(recipe => recipe!)
            .ToArray();
    }

    public async Task<IReadOnlyList<IngredientResponse>> GetIngredientsAsync(CancellationToken cancellationToken = default)
    {
        var snapshot = await firestore.Database
            .Collection(FirestoreCollectionNames.SharedIngredients)
            .GetSnapshotAsync(cancellationToken);

        return snapshot.Documents
            .Select(document => new IngredientResponse(
                document.Id,
                document.ContainsField("name") ? document.GetValue<string>("name") : document.Id,
                document.ContainsField("image") ? document.GetValue<string>("image") : string.Empty))
            .OrderBy(ingredient => ingredient.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public async Task<IReadOnlyList<RecipeResponse>> GetRecipeCatalogAsync(CancellationToken cancellationToken = default)
    {
        var snapshot = await firestore.Database
            .Collection(FirestoreCollectionNames.SharedRecipes)
            .GetSnapshotAsync(cancellationToken);

        return snapshot.Documents
            .Select(document => MapRecipe(document, "shared", null))
            .OrderBy(recipe => recipe.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private async Task<(IReadOnlyList<string> selectedIds, ISet<string> selectedSharedIds, Dictionary<string, RecipeResponse> personalRecipes, Dictionary<string, RecipeResponse> sharedRecipes)> LoadMenuRecipeMapsAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var selectedIds = await ReadSelectionIdsAsync(userId, cancellationToken);
        var personalRecipes = await ReadPersonalRecipeMapAsync(userId, cancellationToken);
        var sharedRecipes = await ReadSharedRecipeMapAsync(cancellationToken);
        var sharedRecipeIds = sharedRecipes.Keys.ToHashSet(StringComparer.Ordinal);
        var selectedSharedIds = selectedIds.Where(sharedRecipeIds.Contains).ToHashSet(StringComparer.Ordinal);

        return (selectedIds, selectedSharedIds, personalRecipes, sharedRecipes);
    }

    private async Task<IReadOnlyList<string>> ReadSelectionIdsAsync(string userId, CancellationToken cancellationToken)
    {
        var snapshot = await firestore.Database
            .Collection("users")
            .Document(userId)
            .Collection(FirestoreCollectionNames.UserData)
            .Document(FirestoreCollectionNames.SharedRecipes)
            .GetSnapshotAsync(cancellationToken);

        return snapshot.Exists ? ReadStringList(snapshot).ToArray() : Array.Empty<string>();
    }

    private async Task<Dictionary<string, RecipeResponse>> ReadPersonalRecipeMapAsync(string userId, CancellationToken cancellationToken)
    {
        var snapshot = await firestore.Database
            .Collection("users")
            .Document(userId)
            .Collection(FirestoreCollectionNames.UserRecipes)
            .GetSnapshotAsync(cancellationToken);

        return snapshot.Documents.ToDictionary(
            document => document.Id,
            document => MapRecipe(document, "forked", document.ContainsField("sourceRecipeId") ? document.GetValue<string?>("sourceRecipeId") : null),
            StringComparer.Ordinal);
    }

    private async Task<Dictionary<string, RecipeResponse>> ReadSharedRecipeMapAsync(CancellationToken cancellationToken)
    {
        var snapshot = await firestore.Database
            .Collection(FirestoreCollectionNames.SharedRecipes)
            .GetSnapshotAsync(cancellationToken);

        return snapshot.Documents.ToDictionary(
            document => document.Id,
            document => MapRecipe(document, "shared", null),
            StringComparer.Ordinal);
    }

    private static UserProfileResponse MapProfile(DocumentSnapshot document)
    {
        return new UserProfileResponse(
            document.ContainsField("uid") ? document.GetValue<string>("uid") : document.Id,
            document.ContainsField("displayName") ? document.GetValue<string>("displayName") : string.Empty,
            document.ContainsField("email") ? document.GetValue<string?>("email") : null,
            document.ContainsField("photoURL") ? document.GetValue<string?>("photoURL") : null,
            document.ContainsField("providerId") ? document.GetValue<string?>("providerId") : null,
            document.ContainsField("createdAt") ? document.GetValue<string>("createdAt") : string.Empty,
            document.ContainsField("updatedAt") ? document.GetValue<string>("updatedAt") : string.Empty);
    }

    private static RecipeResponse MapRecipe(DocumentSnapshot document, string fallbackOrigin, string? fallbackSourceRecipeId)
    {
        var origin = document.ContainsField("origin")
            ? document.GetValue<string>("origin")
            : fallbackOrigin;

        var sourceRecipeId = document.ContainsField("sourceRecipeId")
            ? document.GetValue<string?>("sourceRecipeId")
            : fallbackSourceRecipeId;

        return new RecipeResponse(
            document.Id,
            document.ContainsField("name") ? document.GetValue<string>("name") : document.Id,
            document.ContainsField("servings") ? document.GetValue<int>("servings") : 1,
            document.ContainsField("image") ? document.GetValue<string>("image") : string.Empty,
            document.ContainsField("ingredients")
                ? document.GetValue<Dictionary<string, int>>("ingredients")
                : new Dictionary<string, int>(),
            origin,
            sourceRecipeId);
    }

    private static IReadOnlyDictionary<string, int> ReadIntDictionary(DocumentSnapshot document)
    {
        if (!document.ContainsField("values")) return new Dictionary<string, int>();
        return document.GetValue<Dictionary<string, int>>("values");
    }

    private static IReadOnlyCollection<string> ReadStringList(DocumentSnapshot document)
    {
        if (!document.ContainsField("values")) return Array.Empty<string>();
        return document.GetValue<List<string>>("values");
    }
}

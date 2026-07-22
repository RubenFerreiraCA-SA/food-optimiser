using Google.Cloud.Firestore;
using MealOptimiser.Api.Contracts.Ingredients;
using MealOptimiser.Api.Contracts.Recipes;
using MealOptimiser.Api.Contracts.Users;
using MealOptimiser.Api.Infrastructure.Firestore;

namespace MealOptimiser.Api.Services;

public sealed class FirestoreAppStateWriteService(
    IFirestoreDbAccessor firestore,
    IReadOnlyAppStateService readOnlyAppState) : IAppStateWriteService
{
    public async Task<UserPantryResponse> ReplacePantryAsync(
        string userId,
        IReadOnlyDictionary<string, int> values,
        CancellationToken cancellationToken = default)
    {
        await SetUserDataDocumentAsync(userId, FirestoreCollectionNames.SharedIngredients, new { values }, cancellationToken);
        return (await readOnlyAppState.GetPantryAsync(userId, cancellationToken)) ?? new UserPantryResponse(values);
    }

    public async Task<UserPantryResponse> AddPantryIngredientAsync(
        string userId,
        string ingredientId,
        int quantity,
        CancellationToken cancellationToken = default)
    {
        var pantry = await ReadUserDataDocumentAsync<Dictionary<string, int>>(userId, FirestoreCollectionNames.SharedIngredients, cancellationToken)
            ?? new Dictionary<string, int>(StringComparer.Ordinal);

        pantry[ingredientId] = pantry.TryGetValue(ingredientId, out var current) ? current + quantity : quantity;

        return await ReplacePantryAsync(userId, pantry, cancellationToken);
    }

    public async Task<UserPantryResponse> SetPantryIngredientAsync(
        string userId,
        string ingredientId,
        int quantity,
        CancellationToken cancellationToken = default)
    {
        var pantry = await ReadUserDataDocumentAsync<Dictionary<string, int>>(userId, FirestoreCollectionNames.SharedIngredients, cancellationToken)
            ?? new Dictionary<string, int>(StringComparer.Ordinal);

        pantry[ingredientId] = quantity;

        return await ReplacePantryAsync(userId, pantry, cancellationToken);
    }

    public async Task<UserPantryResponse> RemovePantryIngredientAsync(
        string userId,
        string ingredientId,
        CancellationToken cancellationToken = default)
    {
        var pantry = await ReadUserDataDocumentAsync<Dictionary<string, int>>(userId, FirestoreCollectionNames.SharedIngredients, cancellationToken)
            ?? new Dictionary<string, int>(StringComparer.Ordinal);

        pantry.Remove(ingredientId);

        return await ReplacePantryAsync(userId, pantry, cancellationToken);
    }

    public async Task<UserMenuResponse> ReplaceMenuAsync(
        string userId,
        IReadOnlyCollection<string> values,
        CancellationToken cancellationToken = default)
    {
        var selection = new { values = values.Distinct(StringComparer.Ordinal).ToArray() };
        await SetUserDataDocumentAsync(userId, FirestoreCollectionNames.SharedRecipes, selection, cancellationToken);
        return (await readOnlyAppState.GetMenuAsync(userId, cancellationToken)) ?? new UserMenuResponse(selection.values);
    }

    public async Task<UserMenuResponse> AddMenuRecipeAsync(
        string userId,
        string recipeId,
        CancellationToken cancellationToken = default)
    {
        var menu = await ReadUserDataDocumentAsync<List<string>>(userId, FirestoreCollectionNames.SharedRecipes, cancellationToken)
            ?? new List<string>();

        if (!menu.Any(item => string.Equals(item, recipeId, StringComparison.Ordinal)))
        {
            menu.Add(recipeId);
        }

        return await ReplaceMenuAsync(userId, menu, cancellationToken);
    }

    public async Task<UserMenuResponse> RemoveMenuRecipeAsync(
        string userId,
        string recipeId,
        CancellationToken cancellationToken = default)
    {
        var menu = await ReadUserDataDocumentAsync<List<string>>(userId, FirestoreCollectionNames.SharedRecipes, cancellationToken)
            ?? new List<string>();

        menu.RemoveAll(item => string.Equals(item, recipeId, StringComparison.Ordinal));

        return await ReplaceMenuAsync(userId, menu, cancellationToken);
    }

    public async Task<RecipeResponse> CreatePersonalRecipeAsync(
        string userId,
        UpsertRecipeRequest request,
        CancellationToken cancellationToken = default)
    {
        var id = await CreateUniqueDocumentIdAsync(
            firestore.Database.Collection("users").Document(userId).Collection(FirestoreCollectionNames.UserRecipes),
            cancellationToken);

        var document = new
        {
            name = request.Name.Trim(),
            servings = request.Servings,
            image = request.Image,
            ingredients = request.Ingredients,
            origin = request.SourceRecipeId is null ? "custom" : "forked",
            sourceRecipeId = request.SourceRecipeId,
        };

        await firestore.Database
            .Collection("users")
            .Document(userId)
            .Collection(FirestoreCollectionNames.UserRecipes)
            .Document(id)
            .SetAsync(document, cancellationToken: cancellationToken);

        await AddMenuRecipeAsync(userId, id, cancellationToken);
        return new RecipeResponse(id, request.Name.Trim(), request.Servings, request.Image, request.Ingredients, request.SourceRecipeId is null ? "custom" : "forked", request.SourceRecipeId);
    }

    public async Task<RecipeResponse?> UpdatePersonalRecipeAsync(
        string userId,
        string recipeId,
        UpsertRecipeRequest request,
        CancellationToken cancellationToken = default)
    {
        var reference = firestore.Database
            .Collection("users")
            .Document(userId)
            .Collection(FirestoreCollectionNames.UserRecipes)
            .Document(recipeId);

        var snapshot = await reference.GetSnapshotAsync(cancellationToken);
        if (!snapshot.Exists)
        {
            return null;
        }

        var origin = snapshot.ContainsField("origin") ? snapshot.GetValue<string>("origin") : "custom";
        var sourceRecipeId = snapshot.ContainsField("sourceRecipeId") ? snapshot.GetValue<string?>("sourceRecipeId") : request.SourceRecipeId;

        await reference.SetAsync(new
        {
            name = request.Name.Trim(),
            servings = request.Servings,
            image = request.Image,
            ingredients = request.Ingredients,
            origin,
            sourceRecipeId,
        }, cancellationToken: cancellationToken);

        await AddMenuRecipeAsync(userId, recipeId, cancellationToken);
        return new RecipeResponse(recipeId, request.Name.Trim(), request.Servings, request.Image, request.Ingredients, origin, sourceRecipeId);
    }

    public async Task<bool> DeletePersonalRecipeAsync(
        string userId,
        string recipeId,
        CancellationToken cancellationToken = default)
    {
        var reference = firestore.Database
            .Collection("users")
            .Document(userId)
            .Collection(FirestoreCollectionNames.UserRecipes)
            .Document(recipeId);

        var snapshot = await reference.GetSnapshotAsync(cancellationToken);
        if (!snapshot.Exists)
        {
            return false;
        }

        await reference.DeleteAsync(cancellationToken: cancellationToken);
        await RemoveMenuRecipeAsync(userId, recipeId, cancellationToken);
        return true;
    }

    public async Task<IngredientResponse> CreateIngredientAsync(
        CreateIngredientRequest request,
        CancellationToken cancellationToken = default)
    {
        var cleanName = request.Name.Trim();
        var existing = await FindIngredientByNameAsync(cleanName, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var collection = firestore.Database.Collection(FirestoreCollectionNames.SharedIngredients);
        var id = await CreateUniqueDocumentIdAsync(collection, cancellationToken);
        var image = request.Image?.Trim() ?? string.Empty;

        await collection.Document(id).SetAsync(new
        {
            name = cleanName,
            image,
        }, cancellationToken: cancellationToken);

        return new IngredientResponse(id, cleanName, image);
    }

    public async Task<RecipeResponse> CreateGlobalRecipeAsync(
        UpsertRecipeRequest request,
        CancellationToken cancellationToken = default)
    {
        var cleanName = request.Name.Trim();
        var collection = firestore.Database.Collection(FirestoreCollectionNames.SharedRecipes);
        var id = await CreateUniqueDocumentIdAsync(collection, cancellationToken);

        var document = new
        {
            name = cleanName,
            servings = request.Servings,
            image = request.Image,
            ingredients = request.Ingredients,
            origin = "shared",
            sourceRecipeId = (string?)null,
        };

        await collection.Document(id).SetAsync(document, cancellationToken: cancellationToken);

        return new RecipeResponse(id, cleanName, request.Servings, request.Image, request.Ingredients, "shared", null);
    }

    private async Task<IngredientResponse?> FindIngredientByNameAsync(
        string name,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(name);
        var snapshot = await firestore.Database
            .Collection(FirestoreCollectionNames.SharedIngredients)
            .GetSnapshotAsync(cancellationToken);

        return snapshot.Documents
            .Select(document => new IngredientResponse(
                document.Id,
                document.ContainsField("name") ? document.GetValue<string>("name") : document.Id,
                document.ContainsField("image") ? document.GetValue<string>("image") : string.Empty))
            .FirstOrDefault(ingredient => Normalize(ingredient.Name) == normalized);
    }

    private async Task SetUserDataDocumentAsync<T>(
        string userId,
        string documentId,
        T value,
        CancellationToken cancellationToken)
    {
        await firestore.Database
            .Collection("users")
            .Document(userId)
            .Collection(FirestoreCollectionNames.UserData)
            .Document(documentId)
            .SetAsync(value, cancellationToken: cancellationToken);
    }

    private async Task<T?> ReadUserDataDocumentAsync<T>(
        string userId,
        string documentId,
        CancellationToken cancellationToken)
        where T : class
    {
        var snapshot = await firestore.Database
            .Collection("users")
            .Document(userId)
            .Collection(FirestoreCollectionNames.UserData)
            .Document(documentId)
            .GetSnapshotAsync(cancellationToken);

        if (!snapshot.Exists)
        {
            return null;
        }

        if (typeof(T) == typeof(Dictionary<string, int>))
        {
            var values = snapshot.ContainsField("values")
                ? snapshot.GetValue<Dictionary<string, int>>("values")
                : new Dictionary<string, int>();
            return values as T;
        }

        if (typeof(T) == typeof(List<string>))
        {
            var values = snapshot.ContainsField("values")
                ? snapshot.GetValue<List<string>>("values")
                : new List<string>();
            return values as T;
        }

        return null;
    }

    private async Task<string> CreateUniqueDocumentIdAsync(
        CollectionReference collection,
        CancellationToken cancellationToken)
    {
        var existingIds = (await collection.GetSnapshotAsync(cancellationToken))
            .Documents
            .Select(document => document.Id)
            .ToHashSet(StringComparer.Ordinal);

        string id;
        do
        {
            id = FirestoreIdGenerator.CreateHexId();
        }
        while (existingIds.Contains(id));

        return id;
    }

    private static string Normalize(string value) => value.Trim().ToLowerInvariant();
}

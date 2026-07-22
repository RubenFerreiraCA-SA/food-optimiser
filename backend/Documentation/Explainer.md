# Meal Optimiser API Explainer

This document explains the backend foundation at a file level.
It focuses on the host, configuration, Firestore access, the schema contracts, and the current API surface for user, pantry, menu, ingredient, and recipe data.

## Project files

### [Program.cs](../Program.cs)

Application startup.

It:

- builds the ASP.NET Core host
- loads `appsettings.local.json` on developer machines
- registers the backend services
- enables the frontend CORS policy
- maps the read-only controllers and diagnostic endpoints

### [Infrastructure/DependencyInjection.cs](../Infrastructure/DependencyInjection.cs)

The backend service registration entry point.

It binds Firebase configuration, validates required settings, registers Firestore, and configures CORS origins.

It also registers the controller pipeline and the read-state service layer.

### [Infrastructure/Configuration/FirebaseOptions.cs](../Infrastructure/Configuration/FirebaseOptions.cs)

The strongly typed Firebase configuration model.

It defines:

- Firestore project id
- emulator settings
- allowed frontend origins

### [Infrastructure/Firestore/FirestoreCollectionNames.cs](../Infrastructure/Firestore/FirestoreCollectionNames.cs)

Central names for the Firestore collections used by the app.

Keeping these values in one place helps avoid schema drift between future services.

### [Infrastructure/Firestore/FirestoreDbAccessor.cs](../Infrastructure/Firestore/FirestoreDbAccessor.cs)

A lightweight wrapper around the Firestore client.

This gives the rest of the backend a single injectable access point for the database connection.

### [Infrastructure/UserContext/CurrentUserAccessor.cs](../Infrastructure/UserContext/CurrentUserAccessor.cs)

Resolves the current user id from the request.

It checks claims first and falls back to the temporary `X-User-Id` header for local use.

### [Domain/Ingredients/IngredientDocument.cs](../Domain/Ingredients/IngredientDocument.cs)

Typed representation of a shared ingredient document.

### [Domain/Recipes/RecipeDocument.cs](../Domain/Recipes/RecipeDocument.cs)

Typed representation of a recipe document.

It includes the fork metadata fields needed for shared and user-owned recipes.

### [Domain/Users/UserProfileDocument.cs](../Domain/Users/UserProfileDocument.cs)

Typed representation of the user profile document stored under `users/{uid}/profile/main`.

### [Domain/Users/UserPantryDocument.cs](../Domain/Users/UserPantryDocument.cs)

Typed representation of the pantry quantities stored under `users/{uid}/data/ingredients`.

### [Domain/Users/UserRecipeSelectionDocument.cs](../Domain/Users/UserRecipeSelectionDocument.cs)

Typed representation of the user menu selection stored under `users/{uid}/data/recipes`.

### [Controllers/ProfileController.cs](../Controllers/ProfileController.cs)

Routes for the current user's profile.

### [Controllers/PantryController.cs](../Controllers/PantryController.cs)

Routes for the current user's pantry.

### [Controllers/MenuController.cs](../Controllers/MenuController.cs)

Routes for the current user's menu selection, menu recipe views, and personal recipe mutations.

### [Controllers/IngredientsController.cs](../Controllers/IngredientsController.cs)

Routes for the shared ingredient catalog.

### [Controllers/RecipesController.cs](../Controllers/RecipesController.cs)

Routes for the global shared recipe catalog.

### [Controllers/PlanController.cs](../Controllers/PlanController.cs)

Route for generating an optimised meal plan from supplied ingredients and recipes.

### [Services/IReadOnlyAppStateService.cs](../Services/IReadOnlyAppStateService.cs)

The read-service contract that backs the controllers.

### [Services/FirestoreReadOnlyAppStateService.cs](../Services/FirestoreReadOnlyAppStateService.cs)

The Firestore-backed implementation of the read-service contract.

### [appsettings.json](../appsettings.json)

Shared backend settings.

This currently holds the Firebase project id and the default frontend origins.

### [appsettings.local.json](../appsettings.local.json)

Local overrides for backend development.

This is where the Firestore emulator settings live.

### [Properties/launchSettings.json](../Properties/launchSettings.json)

The local `dotnet run` profile.

It sets the local port, environment name, and emulator host.

## What the current endpoints expose

- `GET /api/health`
- `GET /api/info`
- `GET /api/profile`
- `GET /api/pantry`
- `GET /api/menu`
- `PUT /api/pantry`
- `POST /api/pantry/{ingredientId}`
- `PUT /api/pantry/{ingredientId}`
- `DELETE /api/pantry/{ingredientId}`
- `PUT /api/menu`
- `POST /api/menu/{recipeId}`
- `DELETE /api/menu/{recipeId}`
- `GET /api/menu/all`
- `GET /api/menu/personal-recipes`
- `GET /api/menu/shared-recipes`
- `GET /api/ingredients`
- `GET /api/ingredients/{ingredientId}`
- `POST /api/ingredients`
- `GET /api/recipes`
- `GET /api/recipes/{recipeId}`
- `POST /api/recipes`
- `POST /api/plan`

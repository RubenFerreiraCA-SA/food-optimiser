# Meal Optimiser API Explainer

This document explains the backend foundation at a file level.
The project is intentionally set up without endpoints yet, so this file focuses on the host, configuration, Firestore access, and the schema contracts the future endpoints will use.

## Project files

### [Program.cs](../Program.cs)

Application startup.

It:

- builds the ASP.NET Core host
- loads `appsettings.local.json` on developer machines
- registers the backend services
- enables the frontend CORS policy
- starts the app without mapping routes yet

### [Infrastructure/DependencyInjection.cs](../Infrastructure/DependencyInjection.cs)

The backend service registration entry point.

It binds Firebase configuration, validates required settings, registers Firestore, and configures CORS origins.

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

### [appsettings.json](../appsettings.json)

Shared backend settings.

This currently holds the Firebase project id and the default frontend origins.

### [appsettings.local.json](../appsettings.local.json)

Local overrides for backend development.

This is where the Firestore emulator settings live.

### [Properties/launchSettings.json](../Properties/launchSettings.json)

The local `dotnet run` profile.

It sets the local port, environment name, and emulator host.

## What is not here

There are intentionally no API endpoints yet.

That layer will be added after the route contracts are defined.

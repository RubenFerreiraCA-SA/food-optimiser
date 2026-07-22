# Meal Optimiser API About

This backend is the ASP.NET Core foundation for the app.
It is wired to Firestore and the Firebase schema and now exposes the user, pantry, menu, ingredient, and recipe endpoints used by the frontend.

## What the backend does

The backend currently:

- boots an ASP.NET Core host
- binds Firebase configuration
- connects to Firestore
- configures the frontend CORS policy
- exposes typed schema contracts for recipes, ingredients, pantry data, and user profiles
- exposes read and write endpoints for the current user, menu views, and shared ingredient data

## Firestore

The backend reads and writes the same Firestore schema the frontend uses.

Current collection groups:

- `recipes` for shared recipes
- `ingredients` for shared ingredients
- `users/{uid}/profile/main`
- `users/{uid}/data/recipes`
- `users/{uid}/data/ingredients`
- `users/{uid}/recipes`

## Endpoints

### `GET /api/health`

Simple liveness check.

### `GET /api/info`

Runtime and Firestore connectivity information.

### `GET /api/profile`

Returns the authenticated user's profile.

### `GET /api/pantry`

Returns the authenticated user's pantry quantities.

### `PUT /api/pantry`

Replaces the authenticated user's pantry quantities.

### `POST /api/pantry/{ingredientId}`

Adds a quantity for one ingredient in the pantry.

### `PUT /api/pantry/{ingredientId}`

Sets a specific pantry quantity for one ingredient.

### `DELETE /api/pantry/{ingredientId}`

Removes one ingredient from the pantry.

### `GET /api/menu`

Returns the authenticated user's selected recipe ids.

### `PUT /api/menu`

Replaces the authenticated user's selected recipe ids.

### `POST /api/menu/{recipeId}`

Adds one recipe id to the selected menu list.

### `DELETE /api/menu/{recipeId}`

Removes one recipe id from the selected menu list.

### `GET /api/menu/all`

Returns the combined menu recipe list for the current user:

- shared recipes
- user-owned recipes

### `GET /api/menu/personal-recipes`

Returns only the user's personal recipe forks and custom recipes.

### `GET /api/menu/shared-recipes`

Returns only the shared recipes the current user has added to their menu.

### `POST /api/menu/personal-recipes`

Creates a personal recipe fork or custom recipe for the current user.

### `PUT /api/menu/personal-recipes/{recipeId}`

Updates an existing personal recipe.

### `DELETE /api/menu/personal-recipes/{recipeId}`

Deletes a personal recipe.

### `GET /api/ingredients`

Returns the shared ingredient catalog.

### `GET /api/ingredients/{ingredientId}`

Returns one shared ingredient by id.

### `POST /api/ingredients`

Adds a new shared ingredient if it does not already exist.

### `GET /api/recipes`

Returns the global shared recipe catalog.

### `GET /api/recipes/{recipeId}`

Returns one shared recipe by id.

### `POST /api/recipes`

Creates a new shared recipe in the global catalog.

### `POST /api/plan`

Runs the meal planner against a set of ingredients and recipes and returns the optimised plan.

## Local setup

Run the backend from the repo root with:

```bash
pnpm serve:be
```

The local host is:

```bash
http://localhost:3000
```

## Local environment

When launched locally, the backend expects:

- `ASPNETCORE_ENVIRONMENT=Local`
- `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`
- `X-User-Id` on requests that need the current user until Firebase auth is added

## Configuration

Backend configuration lives in:

- `backend/appsettings.json`
- `backend/appsettings.local.json`
- `backend/Properties/launchSettings.json`

## When to use this file

Use this file if you want to know:

- how the backend is wired
- where the Firestore schema lives
- how to run the service locally
- what is already in place before endpoints are added

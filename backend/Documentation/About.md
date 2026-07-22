# Meal Optimiser API About

This backend is the ASP.NET Core foundation for the app.
It is wired to Firestore and the Firebase schema and now exposes a small read-only route surface.

## What the backend does

The backend currently:

- boots an ASP.NET Core host
- binds Firebase configuration
- connects to Firestore
- configures the frontend CORS policy
- exposes typed schema contracts for recipes, ingredients, pantry data, and user profiles
- exposes read endpoints for the current user, menu views, and shared ingredient data

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

### `GET /api/me/profile`

Returns the authenticated user's profile.

### `GET /api/me/pantry`

Returns the authenticated user's pantry quantities.

### `GET /api/me/menu`

Returns the authenticated user's selected recipe ids.

### `GET /api/me/menu/all`

Returns the combined menu recipe list for the current user:

- shared recipes
- user-owned recipes

### `GET /api/me/menu/personal-recipes`

Returns only the user's personal recipe forks and custom recipes.

### `GET /api/me/menu/shared-recipes`

Returns only the shared recipes the current user has added to their menu.

### `GET /api/ingredients`

Returns the shared ingredient catalog.

### `GET /api/recipes`

Returns the global shared recipe catalog.

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

# Meal Optimiser API About

This backend is the ASP.NET Core foundation for the app.
It is wired to Firestore and the Firebase schema, but it does not expose endpoints yet.

## What the backend does

The backend currently:

- boots an ASP.NET Core host
- binds Firebase configuration
- connects to Firestore
- configures the frontend CORS policy
- exposes typed schema contracts for recipes, ingredients, pantry data, and user profiles

## Firestore

The backend reads and writes the same Firestore schema the frontend uses.

Current collection groups:

- `recipes` for shared recipes
- `ingredients` for shared ingredients
- `users/{uid}/profile/main`
- `users/{uid}/data/recipes`
- `users/{uid}/data/ingredients`
- `users/{uid}/recipes`

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

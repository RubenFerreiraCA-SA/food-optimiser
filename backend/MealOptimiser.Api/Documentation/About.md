# Meal Optimiser API About

This document is for developers who want to understand the API quickly and run it locally without learning the whole project first.

## What the API does

The API is a small ASP.NET Core service that:

- exposes a health endpoint
- exposes an info endpoint
- connects to Firestore
- uses the Firestore emulator during local runs
- allows the frontend to call it from `http://localhost:4200`

## How it works

### Startup

`Program.cs` creates the web app, loads configuration, sets up Firestore, registers CORS, and maps the routes.

### Configuration

The API reads settings from:

- `appsettings.json` for shared settings
- `appsettings.local.json` for local overrides
- `launchSettings.json` when you run from the CLI or an IDE profile

### Firestore

The API connects to Firestore through `Google.Cloud.Firestore`.

For local work:

- `Firestore:UseEmulator` is set to `true`
- `FIRESTORE_EMULATOR_HOST` points at the local emulator

For production:

- the emulator flag is not used
- the API connects to the real Firestore project

### CORS

The API allows requests from:

- `http://localhost:4200`
- `http://127.0.0.1:4200`

That is the local Angular frontend.

## Local setup

Run the backend from the repo root with:

```bash
pnpm serve:be
```

That starts the API at:

```bash
http://localhost:3000
```

## Local environment values

When launched locally, the API expects:

- `ASPNETCORE_ENVIRONMENT=Local`
- `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`

## Endpoints

### `GET /api/health`

Returns a simple health check response.

### `GET /api/info`

Returns basic runtime information, including:

- API name
- current environment name
- version
- Firestore project id
- whether the emulator is active

## When to use this file

Use this file if you are a developer who just needs to:

- start the API
- understand which environment variables matter
- see what endpoints exist
- know whether Firestore is local or production

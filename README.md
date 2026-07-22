# Meal Optimiser

Meal Optimiser is a meal-planning app with an Angular frontend, an ASP.NET Core backend, and Firestore for data storage.

It is set up for two environments:

- `local` on a developer machine
- `production` when deployed

## What is in this repo

- `frontend/` contains the Angular app
- `backend/` contains the ASP.NET Core API
- `firebase.json` and `.firebaserc` contain Firebase hosting and emulator settings
- `_scripts/` contains local orchestration scripts
- `.vscode/` contains recommended editor settings

## Prerequisites

You need:

- Node.js
- `pnpm`
- .NET 8 SDK
- Firebase CLI if you want to run emulators or deploy

## Install

From the repo root:

```bash
pnpm install
```

That installs the frontend and repo tooling dependencies.

## Run locally

### Full stack

Start the frontend, backend, and Firebase emulators together:

```bash
pnpm start
```

This is the quickest way to work on the app locally.

### Frontend only

Start just the Angular app:

```bash
pnpm serve:fe
```

### Backend only

Start just the API:

```bash
pnpm serve:be
```

The backend runs at:

```bash
http://localhost:3000
```

The frontend runs at:

```bash
http://localhost:4200
```

## Backend docs

The backend has two separate docs:

- [Explainer](backend/Documentation/Explainer.md) for a file-by-file breakdown
- [About](backend/Documentation/About.md) for how the API works and how to run it locally

## Firebase

Firebase is used for:

- Firestore data
- Hosting the frontend
- Local emulators

The repo is configured to use the Firebase project alias from `.firebaserc`.

### Local emulators

The local dev script starts the Firestore emulator and emulator UI.

You can also run them directly with:

```bash
firebase emulators:start --only firestore,ui
```

The emulator UI runs at:

```bash
http://localhost:4000
```

## Build

Build the frontend:

```bash
pnpm build
```

## Tests

Run frontend tests:

```bash
pnpm test
```

## Deploy

Deploy the frontend hosting and Firestore rules:

```bash
pnpm deploy
```

This uses Firebase hosting and the Firestore rules in `firestore.rules`.

## Production

The live app is deployed through Firebase Hosting for the `make-the-most-3bcb5` project.

If you need the exact live URL, check the Firebase Hosting entry for that project in the Firebase console.

## Useful files

- [`package.json`](package.json) for repo scripts
- [`angular.json`](angular.json) for frontend build and serve config
- [`firebase.json`](firebase.json) for hosting and emulator config
- [`backend/Program.cs`](backend/Program.cs) for backend startup
- [`backend/Documentation/About.md`](backend/Documentation/About.md) for backend usage

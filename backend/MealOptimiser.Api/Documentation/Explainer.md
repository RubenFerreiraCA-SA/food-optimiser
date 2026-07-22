# Meal Optimiser API Explainer

This document is for understanding the project at a file-by-file level.
It explains what each source file does and why it exists.

## Project files

### [MealOptimiser.Api.csproj](../MealOptimiser.Api.csproj)

The project file for the ASP.NET Core API.

It defines:

- the target framework (`net8.0`)
- nullable reference types and implicit usings
- the project namespace
- the Firestore package dependency

If you want to know what the API depends on or what framework it builds against, this is the file to read.

### [Program.cs](../Program.cs)

The application startup file.

It is responsible for:

- creating the web app host
- loading shared config plus `appsettings.local.json`
- reading the Firestore project id
- deciding whether the Firestore emulator must be used
- registering Firestore in dependency injection
- configuring CORS for the frontend
- defining the API routes

This is the main file that explains how the app boots and what it exposes.

### [appsettings.json](../appsettings.json)

The shared backend config.

This file contains values that are meant to be safe for all environments unless something more specific overrides them.

In this project, it currently holds the default logging levels and the Firestore project id.

### [appsettings.local.json](../appsettings.local.json)

The local override config.

This file exists so a developer machine can use local-specific settings without changing the shared config.

Right now it is used to:

- increase logging detail for local work
- enable the Firestore emulator

### [Properties/launchSettings.json](../Properties/launchSettings.json)

The local run profile for `dotnet run` and IDE debugging.

This file controls:

- the local URL the API listens on
- the environment name used during local runs
- the `FIRESTORE_EMULATOR_HOST` value

It is mainly for developer convenience when starting the API from the command line or from an editor.

### [Documentation/About.md](About.md)

The operational guide for the API.

It explains how the API behaves, what endpoints it exposes, and how to run it locally.

Use this file if you want the quick “how do I serve it?” answer.

## Generated folders

These folders are not source files and are not meant to be edited by hand:

- `bin/` contains compiled output
- `obj/` contains intermediate build output

They are ignored by Git.

## What is not here

This project folder is intentionally small. The frontend app, repo-level scripts, and Firebase configuration live elsewhere in the repository.

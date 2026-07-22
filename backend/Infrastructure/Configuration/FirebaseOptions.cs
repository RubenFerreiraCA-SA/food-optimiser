namespace MealOptimiser.Api.Infrastructure.Configuration;

public sealed class FirebaseOptions
{
    public const string SectionName = "Firebase";
    public const string FirestoreEmulatorHostEnvironmentVariable = "FIRESTORE_EMULATOR_HOST";

    public static readonly string[] DefaultFrontendOrigins =
    [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ];

    public string ProjectId { get; init; } = string.Empty;
    public bool UseFirestoreEmulator { get; init; }
    public string? FirestoreEmulatorHost { get; init; }
    public string[] FrontendOrigins { get; init; } = DefaultFrontendOrigins;
}

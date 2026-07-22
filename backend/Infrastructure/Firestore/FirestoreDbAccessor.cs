using Google.Cloud.Firestore;

namespace MealOptimiser.Api.Infrastructure.Firestore;

public sealed class FirestoreDbAccessor(FirestoreDb database) : IFirestoreDbAccessor
{
    public FirestoreDb Database { get; } = database;
}

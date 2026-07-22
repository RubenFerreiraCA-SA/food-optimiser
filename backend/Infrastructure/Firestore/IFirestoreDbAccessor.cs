using Google.Cloud.Firestore;

namespace MealOptimiser.Api.Infrastructure.Firestore;

public interface IFirestoreDbAccessor
{
    FirestoreDb Database { get; }
}

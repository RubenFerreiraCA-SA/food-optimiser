using System.Security.Cryptography;

namespace MealOptimiser.Api.Infrastructure.Firestore;

public static class FirestoreIdGenerator
{
    public static string CreateHexId()
    {
        Span<byte> bytes = stackalloc byte[4];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

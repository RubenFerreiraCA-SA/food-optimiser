using MealOptimiser.Api.Contracts.Planning;

namespace MealOptimiser.Api.Services;

public sealed class PlannerService(IReadOnlyAppStateService readOnlyAppState) : IPlannerService
{
    private const double Epsilon = 1e-7;

    public async Task<OptimisedPlanResponse> OptimiseAsync(PlanRequest request, CancellationToken cancellationToken = default)
    {
        var catalogIngredientNames = (await readOnlyAppState.GetIngredientsAsync(cancellationToken))
            .ToDictionary(ingredient => ingredient.Id, ingredient => ingredient.Name, StringComparer.Ordinal);
        var requestIngredientNames = request.AvailableIngredients
            .ToDictionary(ingredient => ingredient.Id, ingredient => ingredient.Name, StringComparer.Ordinal);

        var pantry = request.AvailableIngredients
            .Select(ingredient => new PantryItem(ingredient.Id, ingredient.Name, ToQuantity(ingredient.Quantity)))
            .ToArray();

        var ingredientIndex = new Dictionary<string, int>(StringComparer.Ordinal);
        for (var index = 0; index < pantry.Length; index += 1)
        {
            ingredientIndex[pantry[index].Id] = index;
        }

        var candidates = CreateCandidates(request.Recipes, ingredientIndex, pantry.Length).ToArray();
        var capacities = pantry.Select(ingredient => ingredient.Quantity).ToArray();

        var tieWeight = 1;
        for (var index = 0; index < candidates.Length; index += 1)
        {
            tieWeight += MaxDishes(candidates[index], capacities);
        }

        var objective = new int[candidates.Length];
        for (var index = 0; index < candidates.Length; index += 1)
        {
            objective[index] = candidates[index].Recipe.Servings * tieWeight + 1;
        }

        var bestValues = new int[candidates.Length];
        var bestScore = 0.0;
        var root = new Bounds(new int[candidates.Length], candidates.Select(candidate => MaxDishes(candidate, capacities)).ToArray());

        void Search(Bounds bounds)
        {
            var solution = SolveRelaxation(candidates, capacities, objective, bounds);
            if (solution is null || solution.Score < bestScore - Epsilon)
            {
                return;
            }

            var fractionalIndex = -1;
            for (var index = 0; index < solution.Values.Length; index += 1)
            {
                if (Math.Abs(solution.Values[index] - Math.Round(solution.Values[index])) > Epsilon)
                {
                    fractionalIndex = index;
                    break;
                }
            }

            if (fractionalIndex == -1)
            {
                var values = new int[solution.Values.Length];
                for (var index = 0; index < solution.Values.Length; index += 1)
                {
                    values[index] = (int)Math.Round(solution.Values[index]);
                }

                var score = solution.Score;
                if (score > bestScore + Epsilon || (Math.Abs(score - bestScore) <= Epsilon && TotalDishes(values) > TotalDishes(bestValues)))
                {
                    bestValues = values;
                    bestScore = score;
                }

                return;
            }

            var value = solution.Values[fractionalIndex];
            var floor = (int)Math.Floor(value);
            var ceil = (int)Math.Ceiling(value);

            if (floor >= bounds.Lower[fractionalIndex])
            {
                var left = bounds.Copy();
                left.Upper[fractionalIndex] = Math.Min(left.Upper[fractionalIndex], floor);
                if (left.Lower[fractionalIndex] <= left.Upper[fractionalIndex]) Search(left);
            }

            if (ceil <= bounds.Upper[fractionalIndex])
            {
                var right = bounds.Copy();
                right.Lower[fractionalIndex] = Math.Max(right.Lower[fractionalIndex], ceil);
                if (right.Lower[fractionalIndex] <= right.Upper[fractionalIndex]) Search(right);
            }
        }

        Search(root);

        var used = new int[capacities.Length];
        for (var ingredientIndexValue = 0; ingredientIndexValue < capacities.Length; ingredientIndexValue += 1)
        {
            var sum = 0;
            for (var recipeIndex = 0; recipeIndex < candidates.Length; recipeIndex += 1)
            {
                sum += candidates[recipeIndex].Requirements[ingredientIndexValue] * bestValues[recipeIndex];
            }

            used[ingredientIndexValue] = sum;
        }

        var meals = new List<OptimisedPlanMealResponse>();
        for (var index = 0; index < candidates.Length; index += 1)
        {
            var dishes = bestValues[index];
            if (dishes <= 0) continue;

            var ingredientSummary = new List<string>();
            foreach (var ingredient in candidates[index].Recipe.Ingredients)
            {
                var ingredientName =
                    catalogIngredientNames.TryGetValue(ingredient.Key, out var catalogName)
                        ? catalogName
                        : requestIngredientNames.TryGetValue(ingredient.Key, out var requestName)
                            ? requestName
                            : ingredient.Key;
                ingredientSummary.Add($"{ingredient.Value}x {ingredientName}");
            }

            meals.Add(new OptimisedPlanMealResponse(
                candidates[index].Recipe.Id,
                candidates[index].Recipe.Name,
                dishes,
                candidates[index].Recipe.Servings * dishes,
                string.Join(", ", ingredientSummary)));
        }

        var ingredientUsage = new List<IngredientPlanUsageResponse>();
        for (var index = 0; index < pantry.Length; index += 1)
        {
            ingredientUsage.Add(new IngredientPlanUsageResponse(
                pantry[index].Id,
                pantry[index].Name,
                pantry[index].Quantity,
                used[index],
                pantry[index].Quantity - used[index]));
        }

        var totalMeals = 0;
        for (var index = 0; index < candidates.Length; index += 1)
        {
            totalMeals += candidates[index].Recipe.Servings * bestValues[index];
        }

        return new OptimisedPlanResponse(
            meals,
            TotalDishes(bestValues),
            totalMeals,
            ingredientUsage);
    }

    private static IEnumerable<CandidateRecipe> CreateCandidates(
        IReadOnlyList<PlanRecipeRequest> recipes,
        IReadOnlyDictionary<string, int> ingredientIndex,
        int pantrySize)
    {
        foreach (var recipe in recipes)
        {
            if (recipe.Servings < 1 || recipe.Ingredients.Count == 0)
            {
                continue;
            }

            var requirements = new int[pantrySize];
            var valid = true;

            foreach (var (ingredientId, amount) in recipe.Ingredients)
            {
                if (!ingredientIndex.TryGetValue(ingredientId, out var index))
                {
                    valid = false;
                    break;
                }

                var quantity = ToQuantity(amount);
                if (quantity < 1)
                {
                    valid = false;
                    break;
                }

                requirements[index] += quantity;
            }

            if (!valid)
            {
                continue;
            }

            yield return new CandidateRecipe(new RecipeSnapshot(recipe.Id, recipe.Name, recipe.Servings, recipe.Ingredients), requirements);
        }
    }

    private static LinearSolution? SolveRelaxation(
        IReadOnlyList<CandidateRecipe> candidates,
        int[] capacities,
        int[] objective,
        Bounds bounds)
    {
        var lowerUse = new int[capacities.Length];
        for (var ingredientIndex = 0; ingredientIndex < capacities.Length; ingredientIndex += 1)
        {
            var sum = 0;
            for (var recipeIndex = 0; recipeIndex < candidates.Count; recipeIndex += 1)
            {
                sum += candidates[recipeIndex].Requirements[ingredientIndex] * bounds.Lower[recipeIndex];
            }

            lowerUse[ingredientIndex] = sum;
            if (sum > capacities[ingredientIndex])
            {
                return null;
            }
        }

        var rows = new List<double[]>();
        var rhs = new List<double>();

        if (candidates.Count > 0)
        {
            for (var ingredientIndex = 0; ingredientIndex < candidates[0].Requirements.Length; ingredientIndex += 1)
            {
                var row = new double[candidates.Count];
                for (var candidateIndex = 0; candidateIndex < candidates.Count; candidateIndex += 1)
                {
                    row[candidateIndex] = candidates[candidateIndex].Requirements[ingredientIndex];
                }

                rows.Add(row);
                rhs.Add(capacities[ingredientIndex] - lowerUse[ingredientIndex]);
            }
        }

        for (var index = 0; index < candidates.Count; index += 1)
        {
            var range = bounds.Upper[index] - bounds.Lower[index];
            if (range < 0) continue;

            var row = new double[candidates.Count];
            row[index] = 1;
            rows.Add(row);
            rhs.Add(range);
        }

        var relaxation = Simplex(rows, rhs, objective);
        if (relaxation is null)
        {
            return null;
        }

        var values = new double[relaxation.Values.Length];
        for (var index = 0; index < relaxation.Values.Length; index += 1)
        {
            values[index] = relaxation.Values[index] + bounds.Lower[index];
        }

        var score = relaxation.Score;
        for (var index = 0; index < bounds.Lower.Length; index += 1)
        {
            score += bounds.Lower[index] * objective[index];
        }

        return new LinearSolution(values, score);
    }

    private static LinearSolution? Simplex(IReadOnlyList<double[]> matrix, IReadOnlyList<double> rhs, IReadOnlyList<int> objective)
    {
        var variables = objective.Count;
        if (variables == 0)
        {
            return new LinearSolution(Array.Empty<double>(), 0);
        }

        var constraints = matrix.Count;
        var tableau = new List<double[]>(constraints + 1);

        for (var rowIndex = 0; rowIndex < constraints; rowIndex += 1)
        {
            var row = new double[variables + constraints + 1];
            for (var column = 0; column < variables; column += 1)
            {
                row[column] = matrix[rowIndex][column];
            }

            row[variables + rowIndex] = 1;
            row[variables + constraints] = rhs[rowIndex];
            tableau.Add(row);
        }

        var objectiveRow = new double[variables + constraints + 1];
        for (var column = 0; column < variables; column += 1)
        {
            objectiveRow[column] = -objective[column];
        }

        tableau.Add(objectiveRow);

        while (true)
        {
            var currentObjectiveRow = tableau[constraints];
            var entering = -1;
            for (var column = 0; column < variables + constraints; column += 1)
            {
                if (currentObjectiveRow[column] < -Epsilon && (entering == -1 || currentObjectiveRow[column] < currentObjectiveRow[entering]))
                {
                    entering = column;
                }
            }

            if (entering == -1)
            {
                break;
            }

            var leaving = -1;
            for (var row = 0; row < constraints; row += 1)
            {
                var coefficient = tableau[row][entering];
                if (coefficient <= Epsilon)
                {
                    continue;
                }

                if (
                    leaving == -1 ||
                    tableau[row][variables + constraints] / coefficient <
                    tableau[leaving][variables + constraints] / tableau[leaving][entering] - Epsilon)
                {
                    leaving = row;
                }
            }

            if (leaving == -1)
            {
                return null;
            }

            Pivot(tableau, leaving, entering);
        }

        var values = new double[variables];
        for (var column = 0; column < variables; column += 1)
        {
            var basicRow = -1;
            for (var row = 0; row < constraints; row += 1)
            {
                var isBasic = Math.Abs(tableau[row][column] - 1) <= Epsilon;
                if (!isBasic) continue;

                var columnClean = true;
                for (var otherRow = 0; otherRow < constraints; otherRow += 1)
                {
                    if (otherRow == row) continue;
                    if (Math.Abs(tableau[otherRow][column]) > Epsilon)
                    {
                        columnClean = false;
                        break;
                    }
                }

                if (columnClean)
                {
                    basicRow = row;
                    break;
                }
            }

            if (basicRow != -1)
            {
                values[column] = tableau[basicRow][variables + constraints];
            }
        }

        return new LinearSolution(values, tableau[constraints][variables + constraints]);
    }

    private static void Pivot(List<double[]> tableau, int pivotRow, int pivotColumn)
    {
        var pivot = tableau[pivotRow][pivotColumn];
        for (var column = 0; column < tableau[pivotRow].Length; column += 1)
        {
            tableau[pivotRow][column] /= pivot;
        }

        for (var rowIndex = 0; rowIndex < tableau.Count; rowIndex += 1)
        {
            if (rowIndex == pivotRow) continue;

            var factor = tableau[rowIndex][pivotColumn];
            if (Math.Abs(factor) <= Epsilon) continue;

            for (var column = 0; column < tableau[rowIndex].Length; column += 1)
            {
                tableau[rowIndex][column] -= factor * tableau[pivotRow][column];
            }
        }
    }

    private static int MaxDishes(CandidateRecipe candidate, int[] capacities)
    {
        var maximum = int.MaxValue;
        for (var index = 0; index < candidate.Requirements.Length; index += 1)
        {
            var required = candidate.Requirements[index];
            if (required == 0)
            {
                continue;
            }

            maximum = Math.Min(maximum, capacities[index] / required);
        }

        return maximum == int.MaxValue ? 0 : maximum;
    }

    private static int TotalDishes(IReadOnlyList<int> values)
    {
        var total = 0;
        foreach (var value in values)
        {
            total += value;
        }

        return total;
    }

    private static int ToQuantity(int quantity) => Math.Max(0, quantity);

    private sealed record PantryItem(string Id, string Name, int Quantity);

    private sealed record RecipeSnapshot(string Id, string Name, int Servings, IReadOnlyDictionary<string, int> Ingredients);

    private sealed record CandidateRecipe(RecipeSnapshot Recipe, int[] Requirements);

    private sealed record Bounds(int[] Lower, int[] Upper)
    {
        public Bounds Copy() => new((int[])Lower.Clone(), (int[])Upper.Clone());
    }

    private sealed record LinearSolution(double[] Values, double Score);
}

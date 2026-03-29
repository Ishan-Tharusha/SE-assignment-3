using ERPSystem.API.Entities;

namespace ERPSystem.API.Repositories;

public interface IItemRepository
{
    /// <summary>
    /// Items ordered by name. If <paramref name="search"/> is set, filters by name (case-insensitive),
    /// ranking starts-with matches before contains. If <paramref name="limit"/> is set, caps result size (max 100).
    /// If both search and limit are null/empty, returns all items.
    /// </summary>
    Task<IReadOnlyList<Item>> QueryAsync(string? search, int? limit, CancellationToken cancellationToken = default);
}

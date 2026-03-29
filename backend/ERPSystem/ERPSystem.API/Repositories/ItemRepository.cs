using ERPSystem.API.Data;
using ERPSystem.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.API.Repositories;

public class ItemRepository : IItemRepository
{
    private const int MaxLimit = 100;
    private const int DefaultSearchLimit = 50;

    private readonly AppDbContext _db;

    public ItemRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Item>> QueryAsync(string? search, int? limit, CancellationToken cancellationToken = default)
    {
        var term = search?.Trim();
        IQueryable<Item> query = _db.Items.AsNoTracking();

        if (!string.IsNullOrEmpty(term))
        {
            var tl = term.ToLowerInvariant();
            query = query
                .Where(x => x.Name.ToLower().Contains(tl))
                .OrderBy(x => x.Name.ToLower().StartsWith(tl) ? 0 : 1)
                .ThenBy(x => x.Name);
            var cap = limit is > 0 ? Math.Min(limit.Value, MaxLimit) : DefaultSearchLimit;
            query = query.Take(cap);
        }
        else
        {
            query = query.OrderBy(x => x.Name);
            if (limit is > 0)
                query = query.Take(Math.Min(limit.Value, MaxLimit));
        }

        return await query.ToListAsync(cancellationToken);
    }
}

using ERPSystem.API.Data;
using ERPSystem.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.API.Repositories;

public class LocationRepository : ILocationRepository
{
    private readonly AppDbContext _db;

    public LocationRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Location>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _db.Locations.AsNoTracking().OrderBy(x => x.Code).ToListAsync(cancellationToken);
}

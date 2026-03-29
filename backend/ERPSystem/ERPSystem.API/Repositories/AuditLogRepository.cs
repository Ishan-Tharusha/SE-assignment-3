using ERPSystem.API.Data;
using ERPSystem.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.API.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AppDbContext _db;

    public AuditLogRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<AuditLog>> GetRecentAsync(int take = 500, CancellationToken cancellationToken = default) =>
        await _db.AuditLogs.AsNoTracking().OrderByDescending(a => a.CreatedAt).Take(take).ToListAsync(cancellationToken);
}

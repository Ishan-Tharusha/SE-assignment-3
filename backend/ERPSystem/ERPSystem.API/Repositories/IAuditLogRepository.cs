using ERPSystem.API.Entities;

namespace ERPSystem.API.Repositories;

public interface IAuditLogRepository
{
    Task<IReadOnlyList<AuditLog>> GetRecentAsync(int take = 500, CancellationToken cancellationToken = default);
}

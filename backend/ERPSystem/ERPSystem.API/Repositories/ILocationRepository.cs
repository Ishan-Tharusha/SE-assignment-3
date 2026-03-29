using ERPSystem.API.Entities;

namespace ERPSystem.API.Repositories;

public interface ILocationRepository
{
    Task<IReadOnlyList<Location>> GetAllAsync(CancellationToken cancellationToken = default);
}

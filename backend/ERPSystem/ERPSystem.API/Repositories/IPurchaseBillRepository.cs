using ERPSystem.API.DTOs;
using ERPSystem.API.Entities;

namespace ERPSystem.API.Repositories;

public interface IPurchaseBillRepository
{
    Task<PurchaseBill?> GetByIdWithLinesAsync(int id, CancellationToken cancellationToken = default);
    Task<PurchaseBill?> GetByClientSyncIdAsync(string clientSyncId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PurchaseBill>> GetSummariesAsync(CancellationToken cancellationToken = default);
    Task AddAsync(PurchaseBill bill, CancellationToken cancellationToken = default);
    Task<int> CountForBillDateAsync(DateTime billDate, CancellationToken cancellationToken = default);
    Task<bool> AreLineReferencesValidAsync(IReadOnlyList<PurchaseBillLineInputDto> lines, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

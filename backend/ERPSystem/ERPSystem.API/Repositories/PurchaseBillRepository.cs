using ERPSystem.API.Data;
using ERPSystem.API.DTOs;
using ERPSystem.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.API.Repositories;

public class PurchaseBillRepository : IPurchaseBillRepository
{
    private readonly AppDbContext _db;

    public PurchaseBillRepository(AppDbContext db) => _db = db;

    public async Task<PurchaseBill?> GetByIdWithLinesAsync(int id, CancellationToken cancellationToken = default) =>
        await _db.PurchaseBills
            .Include(b => b.Lines).ThenInclude(l => l.Item)
            .Include(b => b.Lines).ThenInclude(l => l.Location)
            .AsSplitQuery()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public async Task<PurchaseBill?> GetByClientSyncIdAsync(string clientSyncId, CancellationToken cancellationToken = default) =>
        await _db.PurchaseBills
            .Include(b => b.Lines).ThenInclude(l => l.Item)
            .Include(b => b.Lines).ThenInclude(l => l.Location)
            .AsSplitQuery()
            .FirstOrDefaultAsync(b => b.ClientSyncId == clientSyncId, cancellationToken);

    public async Task<IReadOnlyList<PurchaseBill>> GetSummariesAsync(CancellationToken cancellationToken = default) =>
        await _db.PurchaseBills
            .AsNoTracking()
            .OrderByDescending(b => b.UpdatedAt)
            .ToListAsync(cancellationToken);

    public Task AddAsync(PurchaseBill bill, CancellationToken cancellationToken = default)
    {
        _db.PurchaseBills.Add(bill);
        return Task.CompletedTask;
    }

    public async Task<int> CountForBillDateAsync(DateTime billDate, CancellationToken cancellationToken = default)
    {
        var day = billDate.Date;
        var next = day.AddDays(1);
        return await _db.PurchaseBills.AsNoTracking()
            .CountAsync(b => b.BillDate >= day && b.BillDate < next, cancellationToken);
    }

    public async Task<bool> AreLineReferencesValidAsync(IReadOnlyList<PurchaseBillLineInputDto> lines, CancellationToken cancellationToken = default)
    {
        if (lines.Count == 0) return false;
        var itemIds = lines.Select(l => l.ItemId).Distinct().ToList();
        var locIds = lines.Select(l => l.LocationId).Distinct().ToList();
        var itemCount = await _db.Items.CountAsync(i => itemIds.Contains(i.Id), cancellationToken);
        var locCount = await _db.Locations.CountAsync(l => locIds.Contains(l.Id), cancellationToken);
        return itemCount == itemIds.Count && locCount == locIds.Count;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _db.SaveChangesAsync(cancellationToken);
}

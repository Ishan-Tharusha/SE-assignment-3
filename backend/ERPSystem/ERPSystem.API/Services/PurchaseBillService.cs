using System.Text.Json;
using ERPSystem.API.Data;
using ERPSystem.API.DTOs;
using ERPSystem.API.Entities;
using ERPSystem.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.API.Services;

public class PurchaseBillService : IPurchaseBillService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly AppDbContext _db;
    private readonly IPurchaseBillRepository _repository;
    private readonly IAuditService _audit;
    private readonly IPurchaseBillPdfService _pdf;

    public PurchaseBillService(
        AppDbContext db,
        IPurchaseBillRepository repository,
        IAuditService audit,
        IPurchaseBillPdfService pdf)
    {
        _db = db;
        _repository = repository;
        _audit = audit;
        _pdf = pdf;
    }

    public async Task<IReadOnlyList<PurchaseBillSummaryDto>> GetSummariesAsync(CancellationToken cancellationToken = default)
    {
        var list = await _repository.GetSummariesAsync(cancellationToken);
        return list.Select(b => new PurchaseBillSummaryDto(b.Id, b.BillNo, b.BillDate, b.UpdatedAt)).ToList();
    }

    public async Task<PurchaseBillDetailDto?> GetDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var bill = await _repository.GetByIdWithLinesAsync(id, cancellationToken);
        return bill == null ? null : MapDetail(bill);
    }

    public async Task<PurchaseBillSaveResponseDto?> CreateAsync(PurchaseBillCreateDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.Lines.Count == 0) return null;
        if (!await _repository.AreLineReferencesValidAsync(dto.Lines, cancellationToken)) return null;

        if (!string.IsNullOrWhiteSpace(dto.ClientSyncId))
        {
            var existing = await _repository.GetByClientSyncIdAsync(dto.ClientSyncId.Trim(), cancellationToken);
            if (existing != null)
                return new PurchaseBillSaveResponseDto(existing.Id, existing.BillNo, "Already synced (duplicate prevented).");
        }

        var billNo = await NextBillNoAsync(dto.BillDate, cancellationToken);
        var now = DateTime.UtcNow;
        var bill = new PurchaseBill
        {
            BillNo = billNo,
            BillDate = dto.BillDate.Date,
            ClientSyncId = string.IsNullOrWhiteSpace(dto.ClientSyncId) ? null : dto.ClientSyncId.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };
        AddLines(bill, dto.Lines);
        await _repository.AddAsync(bill, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        var loaded = await _repository.GetByIdWithLinesAsync(bill.Id, cancellationToken);
        if (loaded != null)
            await _audit.LogAsync("PurchaseBill", "Create", null, SerializeDetail(loaded), cancellationToken);

        return new PurchaseBillSaveResponseDto(bill.Id, bill.BillNo, "Saved.");
    }

    public async Task<PurchaseBillSaveResponseDto?> UpdateAsync(int id, PurchaseBillUpdateDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.Lines.Count == 0) return null;
        if (!await _repository.AreLineReferencesValidAsync(dto.Lines, cancellationToken)) return null;

        var bill = await _repository.GetByIdWithLinesAsync(id, cancellationToken);
        if (bill == null) return null;

        var oldJson = SerializeDetail(bill);

        _db.PurchaseBillLines.RemoveRange(bill.Lines);
        bill.Lines.Clear();
        bill.BillDate = dto.BillDate.Date;
        bill.UpdatedAt = DateTime.UtcNow;
        AddLines(bill, dto.Lines);

        await _repository.SaveChangesAsync(cancellationToken);

        var reloaded = await _repository.GetByIdWithLinesAsync(id, cancellationToken);
        if (reloaded != null)
            await _audit.LogAsync("PurchaseBill", "Update", oldJson, SerializeDetail(reloaded), cancellationToken);

        return new PurchaseBillSaveResponseDto(bill.Id, bill.BillNo, "Updated.");
    }

    public async Task<byte[]?> GetPdfAsync(int id, CancellationToken cancellationToken = default)
    {
        var bill = await _repository.GetByIdWithLinesAsync(id, cancellationToken);
        if (bill == null) return null;
        return _pdf.GeneratePdf(bill);
    }

    private async Task<string> NextBillNoAsync(DateTime billDate, CancellationToken cancellationToken)
    {
        var n = await _repository.CountForBillDateAsync(billDate, cancellationToken) + 1;
        return $"PB-{billDate:yyyyMMdd}-{n:D4}";
    }

    private static void AddLines(PurchaseBill bill, IReadOnlyList<PurchaseBillLineInputDto> lines)
    {
        var order = 0;
        foreach (var l in lines)
        {
            bill.Lines.Add(new PurchaseBillLine
            {
                ItemId = l.ItemId,
                LocationId = l.LocationId,
                Cost = l.Cost,
                Price = l.Price,
                Quantity = l.Quantity,
                DiscountPercent = l.DiscountPercent,
                LineOrder = order++
            });
        }
    }

    private static PurchaseBillDetailDto MapDetail(PurchaseBill bill)
    {
        var ordered = bill.Lines.OrderBy(l => l.LineOrder).ToList();
        var lineDtos = ordered.Select(MapLine).ToList();
        return new PurchaseBillDetailDto(
            bill.Id,
            bill.BillNo,
            bill.BillDate,
            bill.ClientSyncId,
            lineDtos,
            lineDtos.Count,
            lineDtos.Sum(l => l.Quantity),
            lineDtos.Sum(l => l.TotalSelling));
    }

    private static PurchaseBillLineResponseDto MapLine(PurchaseBillLine l)
    {
        var totalCost = l.Cost * l.Quantity * (1 - l.DiscountPercent / 100m);
        var totalSelling = l.Price * l.Quantity;
        return new PurchaseBillLineResponseDto(
            l.Id,
            l.ItemId,
            l.Item.Name,
            l.LocationId,
            l.Location.Name,
            l.Cost,
            l.Price,
            l.Quantity,
            l.DiscountPercent,
            totalCost,
            totalSelling);
    }

    private static string SerializeDetail(PurchaseBill bill) =>
        JsonSerializer.Serialize(MapDetail(bill), JsonOptions);
}

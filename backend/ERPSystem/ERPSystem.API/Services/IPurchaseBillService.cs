using ERPSystem.API.DTOs;

namespace ERPSystem.API.Services;

public interface IPurchaseBillService
{
    Task<IReadOnlyList<PurchaseBillSummaryDto>> GetSummariesAsync(CancellationToken cancellationToken = default);
    Task<PurchaseBillDetailDto?> GetDetailAsync(int id, CancellationToken cancellationToken = default);
    Task<PurchaseBillSaveResponseDto?> CreateAsync(PurchaseBillCreateDto dto, CancellationToken cancellationToken = default);
    Task<PurchaseBillSaveResponseDto?> UpdateAsync(int id, PurchaseBillUpdateDto dto, CancellationToken cancellationToken = default);
    Task<byte[]?> GetPdfAsync(int id, CancellationToken cancellationToken = default);
}

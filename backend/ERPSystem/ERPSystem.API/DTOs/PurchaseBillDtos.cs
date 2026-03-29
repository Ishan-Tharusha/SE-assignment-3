namespace ERPSystem.API.DTOs;

public record PurchaseBillCreateDto(
    DateTime BillDate,
    string? ClientSyncId,
    IReadOnlyList<PurchaseBillLineInputDto> Lines);

public record PurchaseBillUpdateDto(
    DateTime BillDate,
    IReadOnlyList<PurchaseBillLineInputDto> Lines);

public record PurchaseBillSummaryDto(int Id, string BillNo, DateTime BillDate, DateTime UpdatedAt);

public record PurchaseBillDetailDto(
    int Id,
    string BillNo,
    DateTime BillDate,
    string? ClientSyncId,
    IReadOnlyList<PurchaseBillLineResponseDto> Lines,
    int TotalLineCount,
    int TotalQuantity,
    decimal TotalAmount);

public record PurchaseBillSaveResponseDto(int Id, string BillNo, string Message);

public record AuditLogDto(int Id, string Entity, string Action, string? OldValue, string? NewValue, DateTime CreatedAt);

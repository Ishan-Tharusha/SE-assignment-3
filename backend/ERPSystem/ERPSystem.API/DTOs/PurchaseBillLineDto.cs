namespace ERPSystem.API.DTOs;

public record PurchaseBillLineInputDto(
    int ItemId,
    int LocationId,
    decimal Cost,
    decimal Price,
    int Quantity,
    decimal DiscountPercent);

public record PurchaseBillLineResponseDto(
    int Id,
    int ItemId,
    string ItemName,
    int LocationId,
    string LocationName,
    decimal Cost,
    decimal Price,
    int Quantity,
    decimal DiscountPercent,
    decimal TotalCost,
    decimal TotalSelling);

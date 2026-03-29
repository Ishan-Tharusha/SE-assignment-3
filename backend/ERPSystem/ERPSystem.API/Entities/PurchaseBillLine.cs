namespace ERPSystem.API.Entities;

public class PurchaseBillLine
{
    public int Id { get; set; }
    public int PurchaseBillId { get; set; }
    public PurchaseBill PurchaseBill { get; set; } = null!;
    public int ItemId { get; set; }
    public Item Item { get; set; } = null!;
    public int LocationId { get; set; }
    public Location Location { get; set; } = null!;
    public decimal Cost { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal DiscountPercent { get; set; }
    public int LineOrder { get; set; }
}

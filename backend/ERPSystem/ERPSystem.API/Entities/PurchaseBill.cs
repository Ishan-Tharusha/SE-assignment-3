namespace ERPSystem.API.Entities;

public class PurchaseBill
{
    public int Id { get; set; }
    public string BillNo { get; set; } = string.Empty;
    public DateTime BillDate { get; set; }
    public string? ClientSyncId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<PurchaseBillLine> Lines { get; set; } = new List<PurchaseBillLine>();
}

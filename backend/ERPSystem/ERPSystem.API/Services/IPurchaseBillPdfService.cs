using ERPSystem.API.Entities;

namespace ERPSystem.API.Services;

public interface IPurchaseBillPdfService
{
    byte[] GeneratePdf(PurchaseBill bill);
}

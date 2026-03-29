using ERPSystem.API.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ERPSystem.API.Services;

public class PurchaseBillPdfService : IPurchaseBillPdfService
{
    public byte[] GeneratePdf(PurchaseBill bill)
    {
        var lines = bill.Lines.OrderBy(l => l.LineOrder).ToList();
        var totalQty = lines.Sum(l => l.Quantity);
        var totalAmount = lines.Sum(l => l.Price * l.Quantity);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(36);
                page.Header().Text($"Purchase Bill — {bill.BillNo}").SemiBold().FontSize(18);
                page.Content().Column(col =>
                {
                    col.Spacing(12);
                    col.Item().Text($"Date: {bill.BillDate:yyyy-MM-dd}");
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                            c.RelativeColumn();
                            c.RelativeColumn();
                            c.RelativeColumn();
                            c.RelativeColumn();
                            c.RelativeColumn();
                            c.RelativeColumn();
                        });
                        table.Header(h =>
                        {
                            h.Cell().Element(CellStyle).Text("Item");
                            h.Cell().Element(CellStyle).Text("Location");
                            h.Cell().Element(CellStyle).Text("Cost");
                            h.Cell().Element(CellStyle).Text("Price");
                            h.Cell().Element(CellStyle).Text("Qty");
                            h.Cell().Element(CellStyle).Text("Disc %");
                            h.Cell().Element(CellStyle).Text("Line cost");
                            h.Cell().Element(CellStyle).Text("Line sell");
                        });
                        foreach (var l in lines)
                        {
                            var lineCost = l.Cost * l.Quantity * (1 - l.DiscountPercent / 100m);
                            var lineSell = l.Price * l.Quantity;
                            table.Cell().Element(CellStyle).Text(l.Item.Name);
                            table.Cell().Element(CellStyle).Text(l.Location.Name);
                            table.Cell().Element(CellStyle).Text(l.Cost.ToString("N2"));
                            table.Cell().Element(CellStyle).Text(l.Price.ToString("N2"));
                            table.Cell().Element(CellStyle).Text(l.Quantity.ToString());
                            table.Cell().Element(CellStyle).Text(l.DiscountPercent.ToString("N2"));
                            table.Cell().Element(CellStyle).Text(lineCost.ToString("N2"));
                            table.Cell().Element(CellStyle).Text(lineSell.ToString("N2"));
                        }
                    });
                    col.Item().AlignRight().Column(t =>
                    {
                        t.Item().Text($"Total line items: {lines.Count}");
                        t.Item().Text($"Total quantity: {totalQty}");
                        t.Item().Text($"Total amount (selling): {totalAmount:N2}").SemiBold();
                    });
                });
            });
        });

        return document.GeneratePdf();
    }

    private static IContainer CellStyle(IContainer c) =>
        c.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(4);
}

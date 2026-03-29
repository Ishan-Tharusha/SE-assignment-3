using ERPSystem.API.DTOs;
using ERPSystem.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace ERPSystem.API.Controllers;

[ApiController]
[Route("api/purchase-bill")]
public class PurchaseBillController : ControllerBase
{
    private readonly IPurchaseBillService _purchaseBills;

    public PurchaseBillController(IPurchaseBillService purchaseBills) => _purchaseBills = purchaseBills;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PurchaseBillSummaryDto>>> List(CancellationToken cancellationToken) =>
        Ok(await _purchaseBills.GetSummariesAsync(cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PurchaseBillDetailDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var bill = await _purchaseBills.GetDetailAsync(id, cancellationToken);
        return bill == null ? NotFound() : Ok(bill);
    }

    [HttpPost]
    public async Task<ActionResult<PurchaseBillSaveResponseDto>> Create(
        [FromBody] PurchaseBillCreateDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _purchaseBills.CreateAsync(dto, cancellationToken);
        return result == null ? BadRequest("Invalid bill or line data.") : Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PurchaseBillSaveResponseDto>> Update(
        int id,
        [FromBody] PurchaseBillUpdateDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _purchaseBills.UpdateAsync(id, dto, cancellationToken);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> Pdf(int id, CancellationToken cancellationToken)
    {
        var bytes = await _purchaseBills.GetPdfAsync(id, cancellationToken);
        if (bytes == null) return NotFound();
        return File(bytes, "application/pdf", $"purchase-bill-{id}.pdf");
    }
}

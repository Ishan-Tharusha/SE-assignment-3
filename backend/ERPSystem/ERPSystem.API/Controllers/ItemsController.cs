using ERPSystem.API.DTOs;
using ERPSystem.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ERPSystem.API.Controllers;

[ApiController]
[Route("api/items")]
public class ItemsController : ControllerBase
{
    private readonly IItemRepository _items;

    public ItemsController(IItemRepository items) => _items = items;

    /// <summary>
    /// List items. Use <paramref name="search"/> for autocomplete (name contains, starts-with ranked first).
    /// Use <paramref name="limit"/> alone for the first N items by name (e.g. limit=5 for default suggestions).
    /// Omit both for the full catalog.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ItemDto>>> Get(
        [FromQuery] string? search,
        [FromQuery] int? limit,
        CancellationToken cancellationToken)
    {
        var list = await _items.QueryAsync(search, limit, cancellationToken);
        return Ok(list.Select(i => new ItemDto(i.Id, i.Name)).ToList());
    }
}

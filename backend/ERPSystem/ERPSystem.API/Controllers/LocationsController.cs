using ERPSystem.API.DTOs;
using ERPSystem.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ERPSystem.API.Controllers;

[ApiController]
[Route("api/locations")]
public class LocationsController : ControllerBase
{
    private readonly ILocationRepository _locations;

    public LocationsController(ILocationRepository locations) => _locations = locations;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LocationDto>>> GetAll(CancellationToken cancellationToken)
    {
        var list = await _locations.GetAllAsync(cancellationToken);
        return Ok(list.Select(l => new LocationDto(l.Id, l.Code, l.Name)).ToList());
    }
}

using ERPSystem.API.DTOs;
using ERPSystem.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace ERPSystem.API.Controllers;

[ApiController]
[Route("api/audit-logs")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogRepository _auditLogs;

    public AuditLogsController(IAuditLogRepository auditLogs) => _auditLogs = auditLogs;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AuditLogDto>>> GetRecent(CancellationToken cancellationToken)
    {
        var list = await _auditLogs.GetRecentAsync(500, cancellationToken);
        return Ok(list.Select(a => new AuditLogDto(a.Id, a.Entity, a.Action, a.OldValue, a.NewValue, a.CreatedAt)).ToList());
    }
}

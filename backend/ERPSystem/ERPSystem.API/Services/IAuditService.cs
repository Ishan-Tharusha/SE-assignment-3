namespace ERPSystem.API.Services;

public interface IAuditService
{
    Task LogAsync(string entity, string action, string? oldValue, string? newValue, CancellationToken cancellationToken = default);
}

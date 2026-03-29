using ERPSystem.API.Data;
using ERPSystem.API.Repositories;
using ERPSystem.API.Services;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;

QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IItemRepository, ItemRepository>();
builder.Services.AddScoped<ILocationRepository, LocationRepository>();
builder.Services.AddScoped<IPurchaseBillRepository, PurchaseBillRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddSingleton<IPurchaseBillPdfService, PurchaseBillPdfService>();
builder.Services.AddScoped<IPurchaseBillService, PurchaseBillService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Database");
    try
    {
        await db.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied successfully.");
    }
    catch (SqlException ex)
    {
        logger.LogError(
            ex,
            "Could not connect to SQL Server (error {ErrorNumber}). " +
            "1) Start the SQL Server service (services.msc). " +
            "2) Use the correct instance in ConnectionStrings:DefaultConnection: " +
            "'Server=localhost;' for the default instance, or 'Server=localhost\\\\SQLEXPRESS;' for SQL Express. " +
            "3) Override without editing files: dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"<your string>\" " +
            "or set env var ConnectionStrings__DefaultConnection.",
            ex.Number);
        throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("DevCors");
app.UseAuthorization();
app.MapControllers();

app.Run();

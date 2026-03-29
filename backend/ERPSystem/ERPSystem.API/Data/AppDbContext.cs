using ERPSystem.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<PurchaseBill> PurchaseBills => Set<PurchaseBill>();
    public DbSet<PurchaseBillLine> PurchaseBillLines => Set<PurchaseBillLine>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Location>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasMaxLength(32).IsRequired();
            e.Property(x => x.Name).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<Item>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(128).IsRequired();
        });

        modelBuilder.Entity<PurchaseBill>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.BillNo).HasMaxLength(64).IsRequired();
            e.HasIndex(x => x.BillNo).IsUnique();
            e.Property(x => x.ClientSyncId).HasMaxLength(128);
            e.HasIndex(x => x.ClientSyncId).IsUnique().HasFilter("[ClientSyncId] IS NOT NULL");
            e.HasMany(x => x.Lines)
                .WithOne(x => x.PurchaseBill)
                .HasForeignKey(x => x.PurchaseBillId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PurchaseBillLine>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Cost).HasPrecision(18, 4);
            e.Property(x => x.Price).HasPrecision(18, 4);
            e.Property(x => x.DiscountPercent).HasPrecision(9, 4);
            e.HasOne(x => x.Item).WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Location).WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Entity).HasMaxLength(128).IsRequired();
            e.Property(x => x.Action).HasMaxLength(32).IsRequired();
        });

        modelBuilder.Entity<Location>().HasData(
            new Location { Id = 1, Code = "LOC001", Name = "Warehouse A" },
            new Location { Id = 2, Code = "LOC002", Name = "Warehouse B" },
            new Location { Id = 3, Code = "LOC003", Name = "Main Store" });

        modelBuilder.Entity<Item>().HasData(
            new Item { Id = 1, Name = "Mango" },
            new Item { Id = 2, Name = "Apple" },
            new Item { Id = 3, Name = "Banana" },
            new Item { Id = 4, Name = "Orange" },
            new Item { Id = 5, Name = "Grapes" },
            new Item { Id = 6, Name = "Kiwi" },
            new Item { Id = 7, Name = "Strawberry" });
    }
}

using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Data;

public class InventoryContext : DbContext
{
    public InventoryContext(DbContextOptions<InventoryContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(eb =>
        {
            eb.Property(p => p.Price).HasPrecision(18, 2);
            eb.Property(p => p.Stock).HasDefaultValue(0);
            eb.Property(p => p.TotalSold).HasDefaultValue(0);
        });

        modelBuilder.Entity<Order>(eb =>
        {
            eb.Property(o => o.TotalAmount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<OrderItem>(eb =>
        {
            eb.Property(oi => oi.UnitPrice).HasPrecision(18, 2);
        });
    }
}

using InventoryApi.Models;

namespace InventoryApi.Data;

public static class SeedData
{
    public static void Initialize(InventoryContext db)
    {
        db.Database.EnsureCreated();

        if (db.Products.Any())
        {
            return;
        }

        var initialProducts = new List<Product>
        {
            new Product { Name = "Classic Tee", Category = "Apparel", Stock = 24, Price = 19.99m },
            new Product { Name = "Signature Hoodie", Category = "Apparel", Stock = 12, Price = 49.99m },
            new Product { Name = "Slip-On Sneakers", Category = "Footwear", Stock = 8, Price = 64.99m },
            new Product { Name = "Canvas Backpack", Category = "Accessories", Stock = 18, Price = 39.99m },
            new Product { Name = "Smartwatch", Category = "Electronics", Stock = 5, Price = 129.99m },
            new Product { Name = "Wireless Earbuds", Category = "Electronics", Stock = 16, Price = 79.99m },
            new Product { Name = "Travel Mug", Category = "Home", Stock = 30, Price = 14.99m },
            new Product { Name = "Desk Lamp", Category = "Home", Stock = 9, Price = 29.99m }
        };

        db.Products.AddRange(initialProducts);
        db.SaveChanges();
    }
}

namespace InventoryApi.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Stock { get; set; }
    public decimal Price { get; set; }
    public int TotalSold { get; set; }
    public bool IsLowStock => Stock <= 5;
}

using InventoryApi.Data;
using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5041");

builder.Services.AddDbContext<InventoryContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("InventoryDatabase")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactDevClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InventoryContext>();
    SeedData.Initialize(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactDevClient");

app.MapGet("/api/products", async (InventoryContext db, string? search, string? category, bool lowStock = false) =>
{
    var query = db.Products.AsQueryable();

    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(p => p.Name.Contains(search) || p.Category.Contains(search));
    }

    if (!string.IsNullOrWhiteSpace(category))
    {
        query = query.Where(p => p.Category.Contains(category));
    }

    if (lowStock)
    {
        query = query.Where(p => p.Stock <= 5);
    }

    return await query.OrderBy(p => p.Name).ToListAsync();
});

app.MapGet("/api/products/{id}", async (InventoryContext db, int id) =>
{
    var product = await db.Products.FindAsync(id);
    return product is null ? Results.NotFound() : Results.Ok(product);
});

app.MapPost("/api/products", async (InventoryContext db, Product product) =>
{
    db.Products.Add(product);
    await db.SaveChangesAsync();
    return Results.Created($"/api/products/{product.Id}", product);
});

app.MapPut("/api/products/{id}", async (InventoryContext db, int id, Product updatedProduct) =>
{
    var product = await db.Products.FindAsync(id);
    if (product is null) return Results.NotFound();

    product.Name = updatedProduct.Name;
    product.Category = updatedProduct.Category;
    product.Stock = updatedProduct.Stock;
    product.Price = updatedProduct.Price;
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.MapDelete("/api/products/{id}", async (InventoryContext db, int id) =>
{
    var product = await db.Products.FindAsync(id);
    if (product is null) return Results.NotFound();

    db.Products.Remove(product);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/api/orders", async (InventoryContext db) =>
{
    var orders = await db.Orders
        .Include(o => o.Items)
        .OrderByDescending(o => o.OrderDate)
        .ToListAsync();
    return Results.Ok(orders);
});

app.MapPost("/api/orders", async (InventoryContext db, Order order) =>
{
    if (order.Items is null || !order.Items.Any())
    {
        return Results.BadRequest("Order must contain at least one item.");
    }

    var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
    var products = await db.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();

    if (products.Count != productIds.Count)
    {
        return Results.BadRequest("One or more product IDs are invalid.");
    }

    foreach (var item in order.Items)
    {
        var product = products.First(p => p.Id == item.ProductId);

        if (item.Quantity <= 0)
        {
            return Results.BadRequest("Quantity must be greater than zero.");
        }

        if (product.Stock < item.Quantity)
        {
            return Results.BadRequest($"Not enough stock for {product.Name}.");
        }

        item.UnitPrice = product.Price;
        item.ProductName = product.Name;
        product.Stock -= item.Quantity;
        product.TotalSold += item.Quantity;
    }

    order.TotalAmount = order.Items.Sum(i => i.LineTotal);
    order.OrderDate = DateTime.UtcNow;

    db.Orders.Add(order);
    await db.SaveChangesAsync();
    return Results.Created($"/api/orders/{order.Id}", order);
});

app.MapGet("/api/reports/sales", async (InventoryContext db) =>
{
    var totalOrders = await db.Orders.CountAsync();
    var totalRevenue = await db.Orders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
    var bestSellers = await db.Products
        .OrderByDescending(p => p.TotalSold)
        .Take(5)
        .Select(p => new { p.Name, p.TotalSold })
        .ToListAsync();
    var lowStockCount = await db.Products.CountAsync(p => p.Stock <= 5);
    var productCount = await db.Products.CountAsync();

    return Results.Ok(new
    {
        totalOrders,
        totalRevenue,
        lowStockCount,
        productCount,
        bestSellers
    });
});

app.Run();

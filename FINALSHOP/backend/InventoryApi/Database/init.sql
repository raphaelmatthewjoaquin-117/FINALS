-- Inventory DB initialization and seed script
-- Creates the InventoryDb database and required tables, then inserts sample data.
-- Safe to rerun: existing objects are not recreated and seed insertion only happens if Products is empty.

SET NOCOUNT ON;

-- Create database if it does not exist.
IF DB_ID('InventoryDb') IS NULL
BEGIN
    PRINT 'Creating database InventoryDb';
    CREATE DATABASE InventoryDb;
END
GO

USE InventoryDb;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Create Products table if missing.
IF OBJECT_ID('dbo.Products', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Category NVARCHAR(100) NOT NULL,
        Stock INT NOT NULL DEFAULT 0,
        Price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        TotalSold INT NOT NULL DEFAULT 0
    );
    CREATE INDEX IX_Products_Category ON dbo.Products(Category);
    CREATE INDEX IX_Products_Name ON dbo.Products(Name);
END
GO

-- Create Orders table if missing.
IF OBJECT_ID('dbo.Orders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CustomerName NVARCHAR(200) NULL,
        OrderDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00
    );
    CREATE INDEX IX_Orders_OrderDate ON dbo.Orders(OrderDate);
END
GO

-- Create OrderItems table if missing.
IF OBJECT_ID('dbo.OrderItems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        ProductId INT NOT NULL,
        ProductName NVARCHAR(200) NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        UnitPrice DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        LineTotal AS (Quantity * UnitPrice) PERSISTED,
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id) ON DELETE NO ACTION
    );
    CREATE INDEX IX_OrderItems_OrderId ON dbo.OrderItems(OrderId);
    CREATE INDEX IX_OrderItems_ProductId ON dbo.OrderItems(ProductId);
END
GO

-- Seed sample products if the Products table is empty.
IF NOT EXISTS (SELECT 1 FROM dbo.Products)
BEGIN
    PRINT 'Seeding Products table with sample inventory items';
    INSERT INTO dbo.Products (Name, Category, Stock, Price, TotalSold) VALUES
      (N'Classic Tee', N'Apparel', 24, 19.99, 0),
      (N'Signature Hoodie', N'Apparel', 12, 49.99, 0),
      (N'Slip-On Sneakers', N'Footwear', 8, 64.99, 0),
      (N'Canvas Backpack', N'Accessories', 18, 39.99, 0),
      (N'Smartwatch', N'Electronics', 5, 129.99, 0),
      (N'Wireless Earbuds', N'Electronics', 16, 79.99, 0),
      (N'Travel Mug', N'Home', 30, 14.99, 0),
      (N'Desk Lamp', N'Home', 9, 29.99, 0);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Orders)
BEGIN
    PRINT 'Seeding Orders and OrderItems with sample sales data';
    INSERT INTO dbo.Orders (CustomerName, OrderDate, TotalAmount) VALUES
      (N'Alex Morgan', SYSUTCDATETIME(), 209.96),
      (N'Mila Roberts', SYSUTCDATETIME(), 144.98);

    INSERT INTO dbo.OrderItems (OrderId, ProductId, ProductName, Quantity, UnitPrice) VALUES
      (1, 1, N'Classic Tee', 2, 19.99),
      (1, 4, N'Canvas Backpack', 1, 39.99),
      (1, 5, N'Smartwatch', 1, 129.99),
      (2, 3, N'Slip-On Sneakers', 1, 64.99),
      (2, 6, N'Wireless Earbuds', 1, 79.99);
END
GO

PRINT 'InventoryDb initialization completed.';
GO

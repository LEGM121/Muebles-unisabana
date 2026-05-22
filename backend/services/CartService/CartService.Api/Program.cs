using System.Data;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("CartDb")
    ?? builder.Configuration["DATABASE_URL"]
    ?? "Host=localhost;Port=5432;Database=muebles_cart;Username=postgres;Password=postgres";

builder.Services.AddSingleton(new CartDb(connectionString));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CartDb>();
    db.Initialize();
}

app.MapGet("/health", () => Results.Ok(new { service = "CartService", database = "PostgreSQL" }));

app.MapGet("/api/cart/{customerId:guid}", (Guid customerId, CartDb db) =>
{
    var cart = db.GetOrCreateCart(customerId);
    return Results.Ok(cart);
});

app.MapPost("/api/cart/items", (AddCartItemRequest request, CartDb db) =>
{
    if (request.CustomerId == Guid.Empty || request.ProductId == Guid.Empty || request.Quantity <= 0 || request.UnitPrice <= 0)
    {
        return Results.BadRequest(new { message = "customerId, productId, quantity y unitPrice son obligatorios" });
    }

    var cart = db.GetOrCreateCart(request.CustomerId);
    db.AddItem(cart.Id, request.ProductId, request.Quantity, request.UnitPrice, request.ProductName ?? string.Empty);
    var updatedCart = db.GetCartByCustomerId(request.CustomerId);
    return Results.Ok(updatedCart);
});

app.MapDelete("/api/cart/{customerId:guid}/items/{productId:guid}", (Guid customerId, Guid productId, CartDb db) =>
{
    db.RemoveItem(customerId, productId);
    return Results.Ok(new { message = "Item eliminado del carrito" });
});

app.Run();

record AddCartItemRequest(Guid CustomerId, Guid ProductId, int Quantity, decimal UnitPrice, string? ProductName);
record CartResponse(Guid Id, Guid CustomerId, List<CartItemResponse> Items, decimal TotalAmount);
record CartItemResponse(Guid ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal Subtotal);
record CartRecord(Guid Id, Guid CustomerId);

sealed class CartDb
{
    private readonly string _connectionString;

    public CartDb(string connectionString)
    {
        _connectionString = connectionString;
    }

    public void Initialize()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            CREATE TABLE IF NOT EXISTS carts (
                id UUID PRIMARY KEY,
                customer_id UUID NOT NULL UNIQUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS cart_items (
                id UUID PRIMARY KEY,
                cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
                product_id UUID NOT NULL,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price NUMERIC(18,2) NOT NULL,
                UNIQUE(cart_id, product_id)
            );
        ";
        command.ExecuteNonQuery();
    }

    public CartResponse GetOrCreateCart(Guid customerId)
    {
        var existing = GetCartByCustomerId(customerId);
        if (existing is not null)
        {
            return existing;
        }

        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        var cartId = Guid.NewGuid();
        using var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO carts (id, customer_id, created_at, updated_at)
            VALUES (@id, @customerId, NOW(), NOW());
        ";
        command.Parameters.AddWithValue("id", cartId);
        command.Parameters.AddWithValue("customerId", customerId);
        command.ExecuteNonQuery();

        return new CartResponse(cartId, customerId, new List<CartItemResponse>(), 0);
    }

    public void AddItem(Guid cartId, Guid productId, int quantity, decimal unitPrice, string productName)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO cart_items (id, cart_id, product_id, product_name, quantity, unit_price)
            VALUES (@id, @cartId, @productId, @productName, @quantity, @unitPrice)
            ON CONFLICT (cart_id, product_id)
            DO UPDATE SET
                quantity = cart_items.quantity + EXCLUDED.quantity,
                unit_price = EXCLUDED.unit_price,
                product_name = EXCLUDED.product_name;

            UPDATE carts
            SET updated_at = NOW()
            WHERE id = @cartId;
        ";
        command.Parameters.AddWithValue("id", Guid.NewGuid());
        command.Parameters.AddWithValue("cartId", cartId);
        command.Parameters.AddWithValue("productId", productId);
        command.Parameters.AddWithValue("productName", productName);
        command.Parameters.AddWithValue("quantity", quantity);
        command.Parameters.AddWithValue("unitPrice", unitPrice);
        command.ExecuteNonQuery();
    }

    public void RemoveItem(Guid customerId, Guid productId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            DELETE FROM cart_items
            WHERE cart_id = (SELECT id FROM carts WHERE customer_id = @customerId)
              AND product_id = @productId;

            UPDATE carts
            SET updated_at = NOW()
            WHERE customer_id = @customerId;
        ";
        command.Parameters.AddWithValue("customerId", customerId);
        command.Parameters.AddWithValue("productId", productId);
        command.ExecuteNonQuery();
    }

    public CartResponse? GetCartByCustomerId(Guid customerId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        Guid cartId;
        using (var cartCommand = connection.CreateCommand())
        {
            cartCommand.CommandText = @"
                SELECT id, customer_id
                FROM carts
                WHERE customer_id = @customerId
                LIMIT 1;
            ";
            cartCommand.Parameters.AddWithValue("customerId", customerId);

            using var reader = cartCommand.ExecuteReader();
            if (!reader.Read())
            {
                return null;
            }

            cartId = reader.GetGuid(0);
        }

        var items = new List<CartItemResponse>();
        using (var itemsCommand = connection.CreateCommand())
        {
            itemsCommand.CommandText = @"
                SELECT product_id, product_name, quantity, unit_price
                FROM cart_items
                WHERE cart_id = @cartId;
            ";
            itemsCommand.Parameters.AddWithValue("cartId", cartId);

            using var itemsReader = itemsCommand.ExecuteReader();
            while (itemsReader.Read())
            {
                var productId = itemsReader.GetGuid(0);
                var productName = itemsReader.GetString(1);
                var quantity = itemsReader.GetInt32(2);
                var unitPrice = itemsReader.GetDecimal(3);
                items.Add(new CartItemResponse(productId, productName, quantity, unitPrice, quantity * unitPrice));
            }
        }

        var total = items.Sum(item => item.Subtotal);
        return new CartResponse(cartId, customerId, items, total);
    }
}

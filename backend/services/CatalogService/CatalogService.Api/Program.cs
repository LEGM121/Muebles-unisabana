using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// ESTA ES LA INSTRUCCIÓN QUE TUS OTROS SERVICIOS USAN
// La ponemos exactamente igual para asegurar que encuentre la base de datos en Docker
var connectionString = builder.Configuration["DATABASE_URL"] 
                       ?? "Host=proyecto-muebles-postgres;Port=5432;Database=muebles_db;Username=postgres;Password=postgres";

builder.Services.AddSingleton(new CatalogDb(connectionString));

var app = builder.Build();

// Endpoint para consultar el catálogo
app.MapGet("/api/catalog", (CatalogDb db) => Results.Ok(db.GetProducts()));

app.Run();

// Clase de base de datos
sealed class CatalogDb
{
    private readonly string _connectionString;
    public CatalogDb(string connectionString) => _connectionString = connectionString;

    public List<CatalogProductResponse> GetProducts()
    {
        var products = new List<CatalogProductResponse>();
        // Usamos Npgsql para conectar con PostgreSQL (el motor de tu base de datos)
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        // APUNTAMOS A LA TABLA QUE ME INDICASTE: inventory_products
        command.CommandText = @"
            SELECT product_id, name, category, price, image, colors, measures
            FROM inventory_products
            ORDER BY created_at DESC;
        ";

        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            products.Add(new CatalogProductResponse(
                reader.GetGuid(0).ToString(),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetDecimal(3),
                reader.GetString(4),
                SplitList(reader.GetString(5)),
                SplitList(reader.GetString(6))));
        }
        return products;
    }

    private static List<string> SplitList(string raw)
    {
        return string.IsNullOrWhiteSpace(raw)
            ? new List<string>()
            : raw.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
    }
}

record CatalogProductResponse(string Id, string Name, string Category, decimal Price, string Image, List<string> Colors, List<string> Measures);

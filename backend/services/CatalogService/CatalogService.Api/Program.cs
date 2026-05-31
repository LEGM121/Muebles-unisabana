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

    public List<object> GetProducts()
    {
        var products = new List<object>();
        // Usamos Npgsql para conectar con PostgreSQL (el motor de tu base de datos)
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        // APUNTAMOS A LA TABLA QUE ME INDICASTE: inventory_products
        command.CommandText = "SELECT name, price, product_id FROM inventory_products;";

        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            products.Add(new {
                Name = reader.GetString(0),
                Price = reader.GetDecimal(1),
               Id = reader.GetFieldValue<Guid>(2).ToString()
            });
        }
        return products;
    }
}
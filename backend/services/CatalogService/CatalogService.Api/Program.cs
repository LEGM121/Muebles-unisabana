var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { service = "CatalogService" }));
app.MapGet("/api/catalog", () => Results.Ok(new[]
{
    new { Id = "sofa-nordico", Name = "Sofá Nórdico Oslo", Category = "salas", Price = 2499 },
    new { Id = "mesa-luna", Name = "Mesa Comedor Luna", Category = "comedores", Price = 1899 }
}));
app.Run();

using System.Data;
using BCrypt.Net;
using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("AuthDb") ?? "Data Source=auth.db";

builder.Services.AddSingleton(new AuthDb(connectionString));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuthDb>();
    db.Initialize();
}

app.MapGet("/health", () => Results.Ok(new { service = "AuthService" }));

app.MapPost("/api/auth/register", (RegisterRequest request, AuthDb db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FullName))
    {
        return Results.BadRequest(new { message = "Email, password y fullName son obligatorios" });
    }

    var normalizedEmail = request.Email.Trim().ToLowerInvariant();
    var existingUser = db.GetUserByEmail(normalizedEmail);
    if (existingUser is not null)
    {
        return Results.Conflict(new { message = "El usuario ya existe" });
    }

    var user = new UserRecord(
        Guid.NewGuid(),
        normalizedEmail,
        request.FullName.Trim(),
        BCrypt.Net.BCrypt.HashPassword(request.Password),
        "Customer",
        DateTime.UtcNow,
        true);

    db.CreateUser(user);

    return Results.Created($"/api/auth/users/{user.Id}", new
    {
        user.Id,
        user.Email,
        user.FullName,
        user.Role,
        user.CreatedAt
    });
});

app.MapPost("/api/auth/login", (LoginRequest request, AuthDb db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { message = "Email y password son obligatorios" });
    }

    var user = db.GetUserByEmail(request.Email.Trim().ToLowerInvariant());
    if (user is null || !user.IsActive)
    {
        return Results.Unauthorized();
    }

    var isValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
    if (!isValid)
    {
        return Results.Unauthorized();
    }

    var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
    return Results.Ok(new
    {
        token,
        expiresIn = 3600,
        user = new
        {
            user.Id,
            user.Email,
            user.FullName,
            user.Role
        }
    });
});

app.MapGet("/api/auth/users", (AuthDb db) =>
{
    var users = db.GetUsers()
        .Select(user => new
        {
            user.Id,
            user.Email,
            user.FullName,
            user.Role,
            user.CreatedAt,
            user.IsActive
        });

    return Results.Ok(users);
});

app.Run();

record RegisterRequest(string Email, string FullName, string Password);
record LoginRequest(string Email, string Password);

record UserRecord(Guid Id, string Email, string FullName, string PasswordHash, string Role, DateTime CreatedAt, bool IsActive);

sealed class AuthDb
{
    private readonly string _connectionString;

    public AuthDb(string connectionString)
    {
        _connectionString = connectionString;
    }

    public void Initialize()
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            CREATE TABLE IF NOT EXISTS Users (
                Id TEXT PRIMARY KEY,
                Email TEXT NOT NULL UNIQUE,
                FullName TEXT NOT NULL,
                PasswordHash TEXT NOT NULL,
                Role TEXT NOT NULL,
                CreatedAt TEXT NOT NULL,
                IsActive INTEGER NOT NULL
            );
        ";
        command.ExecuteNonQuery();

        SeedDefaultAdmin(connection);
    }

    public void CreateUser(UserRecord user)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO Users (Id, Email, FullName, PasswordHash, Role, CreatedAt, IsActive)
            VALUES ($id, $email, $fullName, $passwordHash, $role, $createdAt, $isActive);
        ";
        command.Parameters.AddWithValue("$id", user.Id.ToString());
        command.Parameters.AddWithValue("$email", user.Email);
        command.Parameters.AddWithValue("$fullName", user.FullName);
        command.Parameters.AddWithValue("$passwordHash", user.PasswordHash);
        command.Parameters.AddWithValue("$role", user.Role);
        command.Parameters.AddWithValue("$createdAt", user.CreatedAt.ToString("O"));
        command.Parameters.AddWithValue("$isActive", user.IsActive ? 1 : 0);
        command.ExecuteNonQuery();
    }

    public UserRecord? GetUserByEmail(string email)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT Id, Email, FullName, PasswordHash, Role, CreatedAt, IsActive
            FROM Users
            WHERE Email = $email
            LIMIT 1;
        ";
        command.Parameters.AddWithValue("$email", email);

        using var reader = command.ExecuteReader();
        if (!reader.Read())
        {
            return null;
        }

        return MapUser(reader);
    }

    public List<UserRecord> GetUsers()
    {
        var users = new List<UserRecord>();
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT Id, Email, FullName, PasswordHash, Role, CreatedAt, IsActive
            FROM Users
            ORDER BY CreatedAt DESC;
        ";

        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            users.Add(MapUser(reader));
        }

        return users;
    }

    private static UserRecord MapUser(IDataRecord record)
    {
        return new UserRecord(
            Guid.Parse(record.GetString(0)),
            record.GetString(1),
            record.GetString(2),
            record.GetString(3),
            record.GetString(4),
            DateTime.Parse(record.GetString(5)),
            record.GetInt32(6) == 1);
    }

    private static void SeedDefaultAdmin(SqliteConnection connection)
    {
        using var existsCommand = connection.CreateCommand();
        existsCommand.CommandText = "SELECT COUNT(1) FROM Users WHERE Email = $email;";
        existsCommand.Parameters.AddWithValue("$email", "admin@muebles.com");
        var exists = Convert.ToInt32(existsCommand.ExecuteScalar()) > 0;
        if (exists)
        {
            return;
        }

        using var insertCommand = connection.CreateCommand();
        insertCommand.CommandText = @"
            INSERT INTO Users (Id, Email, FullName, PasswordHash, Role, CreatedAt, IsActive)
            VALUES ($id, $email, $fullName, $passwordHash, $role, $createdAt, $isActive);
        ";
        insertCommand.Parameters.AddWithValue("$id", Guid.NewGuid().ToString());
        insertCommand.Parameters.AddWithValue("$email", "admin@muebles.com");
        insertCommand.Parameters.AddWithValue("$fullName", "Administrador");
        insertCommand.Parameters.AddWithValue("$passwordHash", BCrypt.Net.BCrypt.HashPassword("Admin123*"));
        insertCommand.Parameters.AddWithValue("$role", "Admin");
        insertCommand.Parameters.AddWithValue("$createdAt", DateTime.UtcNow.ToString("O"));
        insertCommand.Parameters.AddWithValue("$isActive", 1);
        insertCommand.ExecuteNonQuery();
    }
}

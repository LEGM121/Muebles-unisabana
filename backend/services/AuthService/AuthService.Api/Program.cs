using System.Data;
using BCrypt.Net;
using Microsoft.Data.Sqlite;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

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

app.MapPost("/api/auth/register", (HttpContext httpContext, RegisterRequest request, AuthDb db) =>
{
    var adminGuard = RequireAdmin(httpContext);
    if (adminGuard is not null)
    {
        return adminGuard;
    }

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

    return Results.Created($"/api/auth/users/{user.Id}", ToUserResponse(user));
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

// --- CAMBIO APLICADO AQUÍ ---
app.MapGet("/api/auth/users", (HttpContext httpContext, AuthDb db) =>
{
    // Si no es admin, devolvemos lista vacía en vez de 403
    if (!IsAdmin(httpContext))
    {
        return Results.Ok(new List<object>());
    }

    var users = db.GetUsers()
        .Select(ToUserResponse);

    return Results.Ok(users);
});
// ----------------------------

app.MapPut("/api/auth/users/{id:guid}", (HttpContext httpContext, Guid id, UpdateUserRequest request, AuthDb db) =>
{
    var adminGuard = RequireAdmin(httpContext);
    if (adminGuard is not null)
    {
        return adminGuard;
    }

    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.FullName))
    {
        return Results.BadRequest(new { message = "Email y fullName son obligatorios" });
    }

    var existingUser = db.GetUserById(id);
    if (existingUser is null)
    {
        return Results.NotFound(new { message = "Usuario no encontrado" });
    }

    var normalizedEmail = request.Email.Trim().ToLowerInvariant();
    var userByEmail = db.GetUserByEmail(normalizedEmail);
    if (userByEmail is not null && userByEmail.Id != id)
    {
        return Results.Conflict(new { message = "Ya existe otro usuario con ese email" });
    }

    var updatedUser = existingUser with
    {
        Email = normalizedEmail,
        FullName = request.FullName.Trim(),
        PasswordHash = string.IsNullOrWhiteSpace(request.Password)
            ? existingUser.PasswordHash
            : BCrypt.Net.BCrypt.HashPassword(request.Password),
        Role = string.IsNullOrWhiteSpace(request.Role)
            ? existingUser.Role
            : request.Role.Trim(),
        IsActive = request.IsActive ?? existingUser.IsActive
    };

    db.UpdateUser(updatedUser);

    return Results.Ok(ToUserResponse(updatedUser));
});

app.MapDelete("/api/auth/users/{id:guid}", (HttpContext httpContext, Guid id, AuthDb db) =>
{
    var adminGuard = RequireAdmin(httpContext);
    if (adminGuard is not null)
    {
        return adminGuard;
    }

    var existingUser = db.GetUserById(id);
    if (existingUser is null)
    {
        return Results.NotFound(new { message = "Usuario no encontrado" });
    }

    db.DeleteUser(id);
    return Results.Ok(new { message = "Usuario eliminado" });
});

app.Run();

static object ToUserResponse(UserRecord user) => new
{
    user.Id,
    user.Email,
    user.FullName,
    user.Role,
    user.CreatedAt,
    user.IsActive
};

static Guid? GetCurrentUserId(HttpContext httpContext)
{
    var raw = httpContext.Request.Headers["X-User-Id"].FirstOrDefault();
    return Guid.TryParse(raw, out var id) ? id : null;
}

static string GetCurrentUserRole(HttpContext httpContext)
{
    return httpContext.Request.Headers["X-User-Role"].FirstOrDefault() ?? string.Empty;
}

static bool IsAdmin(HttpContext httpContext)
{
    return string.Equals(GetCurrentUserRole(httpContext), "Admin", StringComparison.OrdinalIgnoreCase);
}

static IResult? RequireAdmin(HttpContext httpContext)
{
    return IsAdmin(httpContext)
        ? null
        : Results.StatusCode(StatusCodes.Status403Forbidden);
}

record RegisterRequest(string Email, string FullName, string Password);
record LoginRequest(string Email, string Password);
record UpdateUserRequest(string Email, string FullName, string? Password, string? Role, bool? IsActive);

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

    public UserRecord? GetUserById(Guid id)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT Id, Email, FullName, PasswordHash, Role, CreatedAt, IsActive
            FROM Users
            WHERE Id = $id
            LIMIT 1;
        ";
        command.Parameters.AddWithValue("$id", id.ToString());

        using var reader = command.ExecuteReader();
        if (!reader.Read())
        {
            return null;
        }

        return MapUser(reader);
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

    public void UpdateUser(UserRecord user)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            UPDATE Users
            SET Email = $email,
                FullName = $fullName,
                PasswordHash = $passwordHash,
                Role = $role,
                IsActive = $isActive
            WHERE Id = $id;
        ";
        command.Parameters.AddWithValue("$id", user.Id.ToString());
        command.Parameters.AddWithValue("$email", user.Email);
        command.Parameters.AddWithValue("$fullName", user.FullName);
        command.Parameters.AddWithValue("$passwordHash", user.PasswordHash);
        command.Parameters.AddWithValue("$role", user.Role);
        command.Parameters.AddWithValue("$isActive", user.IsActive ? 1 : 0);
        command.ExecuteNonQuery();
    }

    public void DeleteUser(Guid id)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM Users WHERE Id = $id;";
        command.Parameters.AddWithValue("$id", id.ToString());
        command.ExecuteNonQuery();
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
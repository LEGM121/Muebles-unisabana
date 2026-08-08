using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace AuthService.Tests;

public class LoginIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public LoginIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_EmailVacio_DebeRetornarBadRequest()
    {
        var request = new
        {
            email = "",
            password = "Admin123*"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request
        );

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode
        );
    }

    [Fact]
    public async Task Login_PasswordVacio_DebeRetornarBadRequest()
    {
        var request = new
        {
            email = "admin@muebles.com",
            password = ""
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request
        );

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode
        );
    }

    [Fact]
    public async Task Login_UsuarioInexistente_DebeRetornarUnauthorized()
    {
        var request = new
        {
            email = "usuario-no-existe@muebles.com",
            password = "Password123*"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request
        );

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode
        );
    }

    [Fact]
    public async Task Login_PasswordIncorrecto_DebeRetornarUnauthorized()
    {
        var request = new
        {
            email = "admin@muebles.com",
            password = "PasswordIncorrecto123*"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request
        );

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode
        );
    }

    [Fact]
    public async Task Login_CredencialesCorrectas_DebeRetornarOkYToken()
    {
        var request = new
        {
            email = "admin@muebles.com",
            password = "Admin123*"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request
        );

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode
        );

        var contenido =
            await response.Content.ReadAsStringAsync();

        Assert.Contains("token", contenido);
        Assert.Contains("admin@muebles.com", contenido);
        Assert.Contains("Admin", contenido);

        // La contraseña/hash no debe exponerse
        Assert.DoesNotContain("passwordHash", contenido);
        Assert.DoesNotContain("Admin123*", contenido);
    }
}


using Xunit;
namespace AuthService.Tests;

public class PasswordSecurityTests
{
    [Fact]
    public void HashPassword_DebeGenerarHashDistintoAlTextoPlano()
    {
        var password = "Admin123*";

        var hash = BCrypt.Net.BCrypt.HashPassword(password);

        Assert.NotEqual(password, hash);
        Assert.StartsWith("$2", hash);
    }

    [Fact]
    public void Verify_DebeAceptarPasswordCorrecto()
    {
        var password = "Admin123*";
        var hash = BCrypt.Net.BCrypt.HashPassword(password);

        var resultado = BCrypt.Net.BCrypt.Verify(password, hash);

        Assert.True(resultado);
    }

    [Fact]
    public void Verify_DebeRechazarPasswordIncorrecto()
    {
        var password = "Admin123*";
        var hash = BCrypt.Net.BCrypt.HashPassword(password);

        var resultado = BCrypt.Net.BCrypt.Verify("PasswordIncorrecto123*", hash);

        Assert.False(resultado);
    }

    [Fact]
    public void HashPassword_DebeGenerarHashesDiferentesParaMismaPassword()
    {
        var password = "Admin123*";

        var hash1 = BCrypt.Net.BCrypt.HashPassword(password);
        var hash2 = BCrypt.Net.BCrypt.HashPassword(password);

        Assert.NotEqual(hash1, hash2);

        Assert.True(BCrypt.Net.BCrypt.Verify(password, hash1));
        Assert.True(BCrypt.Net.BCrypt.Verify(password, hash2));
    }
}

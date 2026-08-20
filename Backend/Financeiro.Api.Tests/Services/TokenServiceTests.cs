using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Financeiro.Api.Services.Implementations;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace Financeiro.Api.Tests.Services
{
    // TokenService é lógica "padrão" de JWT, mas bug aqui é bug de segurança: token
    // expirado sendo aceito, ou token com assinatura errada passando validação. Por isso
    // vale testar mesmo sem ser o código mais complexo do projeto.
    public class TokenServiceTests
    {
        private const string ChaveSecretaPadrao = "uma-chave-secreta-bem-grande-para-os-testes-1234567890";

        private static IConfiguration CriarConfiguracao(string? secretKey = ChaveSecretaPadrao, double validadeEmMinutos = 60)
        {
            var valores = new Dictionary<string, string?>
            {
                ["JWT:ValidAudience"] = "https://localhost",
                ["JWT:ValidIssuer"] = "https://localhost",
                ["JWT:TokenValidityInMinutes"] = validadeEmMinutos.ToString(CultureInfo.InvariantCulture)
            };
            if (secretKey != null)
                valores["JWT:SecretKey"] = secretKey;

            return new ConfigurationBuilder().AddInMemoryCollection(valores).Build();
        }

        [Fact]
        public void GenerateAccessToken_ComClaims_DeveGerarTokenComAsClaimsEEmissorCorretos()
        {
            var service = new TokenService();
            var config = CriarConfiguracao();
            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, "usuario.teste"),
                new(ClaimTypes.NameIdentifier, "id-123")
            };

            var token = service.GenerateAccessToken(claims, config);

            Assert.Equal("https://localhost", token.Issuer);
            Assert.Contains(token.Claims, c => c.Type == ClaimTypes.Name && c.Value == "usuario.teste");
            Assert.Contains(token.Claims, c => c.Type == ClaimTypes.NameIdentifier && c.Value == "id-123");
        }

        [Fact]
        public void GenerateAccessToken_SemSecretKeyConfigurada_DeveLancarInvalidOperationException()
        {
            var service = new TokenService();
            var config = CriarConfiguracao(secretKey: null);

            Assert.Throws<InvalidOperationException>(() => service.GenerateAccessToken(new List<Claim>(), config));
        }

        [Fact]
        public void GenerateRefreshToken_DeveGerarValoresDiferentesACadaChamada()
        {
            var service = new TokenService();

            var token1 = service.GenerateRefreshToken();
            var token2 = service.GenerateRefreshToken();

            Assert.False(string.IsNullOrWhiteSpace(token1));
            Assert.NotEqual(token1, token2);
        }

        [Fact]
        public void GetPrincipalFromExpiredToken_ComTokenJaExpirado_DeveConseguirLerOPrincipal()
        {
            // É exatamente pra isso que o método existe: permitir renovar um access token
            // expirado (via refresh token) sem exigir novo login, desde que a assinatura
            // continue válida. Se ValidateLifetime virasse true aqui por engano, esse
            // teste falharia.
            var service = new TokenService();
            var config = CriarConfiguracao(validadeEmMinutos: -10); // já nasce expirado

            var claims = new List<Claim> { new(ClaimTypes.Name, "usuario.teste") };
            var token = service.GenerateAccessToken(claims, config);
            var tokenEscrito = new JwtSecurityTokenHandler().WriteToken(token);

            var principal = service.GetPrincipalFromExpiredToken(tokenEscrito, config);

            Assert.Equal("usuario.teste", principal.Identity?.Name);
        }

        [Fact]
        public void GetPrincipalFromExpiredToken_ComAssinaturaInvalida_DeveLancarSecurityTokenException()
        {
            // Simula um token adulterado/forjado: gerado com uma chave, validado esperando
            // outra. Isso não pode passar de jeito nenhum.
            var service = new TokenService();
            var configOriginal = CriarConfiguracao(secretKey: "chave-original-bem-grande-1234567890-abcdef");
            var configComOutraChave = CriarConfiguracao(secretKey: "chave-diferente-bem-grande-0987654321-fedcba");

            var claims = new List<Claim> { new(ClaimTypes.Name, "usuario.teste") };
            var token = service.GenerateAccessToken(claims, configOriginal);
            var tokenEscrito = new JwtSecurityTokenHandler().WriteToken(token);

            Assert.ThrowsAny<SecurityTokenException>(() =>
                service.GetPrincipalFromExpiredToken(tokenEscrito, configComOutraChave));
        }
    }
}

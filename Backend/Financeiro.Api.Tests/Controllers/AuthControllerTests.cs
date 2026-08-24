using Financeiro.Api.Controllers;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.DTOs;
using Financeiro.Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Xunit;

namespace Financeiro.Api.Tests.Controllers
{
    // Diferente dos testes de Services (que recebem uma dependência mockada simples),
    // o AuthController depende do UserManager<ApplicationUser> do ASP.NET Core Identity
    // — uma classe concreta, não uma interface. O jeito padrão de testar isso sem
    // precisar de um banco de verdade é mockar o UserManager diretamente: todo método
    // usado aqui (FindByNameAsync, CreateAsync, CheckPasswordAsync, UpdateAsync) é
    // virtual, então o Moq consegue sobrescrever cada um. Os parâmetros nulos no
    // construtor do mock (IOptions, IPasswordHasher, validadores, etc.) nunca chegam a
    // ser usados de verdade, porque cada método que o controller chama já está mockado
    // — só o IUserStore precisa de um mock de verdade, e olhe lá, porque o UserManager
    // real exige um no construtor mesmo sem chegar a invocá-lo.
    public class AuthControllerTests
    {
        private static Mock<UserManager<ApplicationUser>> CriarUserManagerMock()
        {
            var storeMock = new Mock<IUserStore<ApplicationUser>>();
            return new Mock<UserManager<ApplicationUser>>(
                storeMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        }

        private static IConfiguration CriarConfiguracao()
        {
            var valores = new Dictionary<string, string?>
            {
                ["JWT:RefreshTokenValidityInMinutes"] = "10080",
            };
            return new ConfigurationBuilder().AddInMemoryCollection(valores).Build();
        }

        // Um JwtSecurityToken de mentira, só pra o AuthController conseguir chamar
        // `new JwtSecurityTokenHandler().WriteToken(...)` em cima dele sem lançar
        // exceção. O conteúdo exato do token (claims, assinatura, expiração) já é
        // coberto por TokenServiceTests — aqui o que importa é só o "encaixe" entre
        // AuthController e ITokenService, não a geração do token em si.
        private static JwtSecurityToken CriarTokenFake() =>
            new(issuer: "https://localhost",
                audience: "https://localhost",
                claims: new[] { new Claim(ClaimTypes.Name, "usuario.teste") },
                expires: DateTime.UtcNow.AddMinutes(30));

        [Fact]
        public async Task Register_ComUsuarioNovo_DeveCriarUsuarioERetornarOk()
        {
            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync("novo.usuario")).ReturnsAsync((ApplicationUser?)null);
            userManagerMock
                .Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), "SenhaForte@123"))
                .ReturnsAsync(IdentityResult.Success);

            var controller = new AuthController(userManagerMock.Object, Mock.Of<ITokenService>(), CriarConfiguracao());
            var model = new RegisterModel
            {
                Username = "novo.usuario",
                Email = "novo@teste.com",
                Password = "SenhaForte@123",
                ConfirmPassword = "SenhaForte@123",
            };

            var resultado = await controller.Register(model);

            var ok = Assert.IsType<OkObjectResult>(resultado);
            var resposta = Assert.IsType<Response>(ok.Value);
            Assert.Equal("Success", resposta.Status);
            userManagerMock.Verify(m => m.CreateAsync(
                It.Is<ApplicationUser>(u => u.UserName == "novo.usuario" && u.Email == "novo@teste.com"),
                "SenhaForte@123"), Times.Once);
        }

        [Fact]
        public async Task Register_ComUsuarioJaExistente_DeveRetornarConflictSemChamarCreateAsync()
        {
            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync("ja.existe"))
                .ReturnsAsync(new ApplicationUser { UserName = "ja.existe" });

            var controller = new AuthController(userManagerMock.Object, Mock.Of<ITokenService>(), CriarConfiguracao());
            var model = new RegisterModel
            {
                Username = "ja.existe",
                Email = "x@teste.com",
                Password = "SenhaForte@123",
                ConfirmPassword = "SenhaForte@123",
            };

            var resultado = await controller.Register(model);

            var conflict = Assert.IsType<ConflictObjectResult>(resultado);
            var resposta = Assert.IsType<Response>(conflict.Value);
            Assert.Equal("Error", resposta.Status);
            userManagerMock.Verify(m => m.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Register_QuandoCreateAsyncFalha_DeveRetornarBadRequestComOsErros()
        {
            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);
            userManagerMock
                .Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Senha muito fraca." }));

            var controller = new AuthController(userManagerMock.Object, Mock.Of<ITokenService>(), CriarConfiguracao());
            var model = new RegisterModel
            {
                Username = "novo.usuario",
                Email = "novo@teste.com",
                Password = "123",
                ConfirmPassword = "123",
            };

            var resultado = await controller.Register(model);

            var badRequest = Assert.IsType<BadRequestObjectResult>(resultado);
            var resposta = Assert.IsType<Response>(badRequest.Value);
            Assert.Contains("Senha muito fraca.", resposta.Message);
        }

        [Fact]
        public async Task Login_ComCredenciaisValidas_DeveRetornarTokenModelEAtualizarRefreshTokenDoUsuario()
        {
            var usuario = new ApplicationUser { Id = "id-1", UserName = "usuario.valido" };
            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync("usuario.valido")).ReturnsAsync(usuario);
            userManagerMock.Setup(m => m.CheckPasswordAsync(usuario, "SenhaCerta@123")).ReturnsAsync(true);
            userManagerMock.Setup(m => m.UpdateAsync(usuario)).ReturnsAsync(IdentityResult.Success);

            var tokenServiceMock = new Mock<ITokenService>();
            tokenServiceMock
                .Setup(t => t.GenerateAccessToken(It.IsAny<IEnumerable<Claim>>(), It.IsAny<IConfiguration>()))
                .Returns(CriarTokenFake());
            tokenServiceMock.Setup(t => t.GenerateRefreshToken()).Returns("refresh-token-gerado");

            var controller = new AuthController(userManagerMock.Object, tokenServiceMock.Object, CriarConfiguracao());
            var model = new LoginModel { Username = "usuario.valido", Password = "SenhaCerta@123" };

            var resultado = await controller.Login(model);

            var ok = Assert.IsType<OkObjectResult>(resultado);
            var token = Assert.IsType<TokenModel>(ok.Value);
            Assert.False(string.IsNullOrWhiteSpace(token.AccessToken));
            Assert.Equal("refresh-token-gerado", token.RefreshToken);
            // O controller salva o refresh token gerado de volta no usuário (via
            // UpdateAsync) — é isso que permite o /refresh-token funcionar depois.
            Assert.Equal("refresh-token-gerado", usuario.RefreshToken);
            Assert.True(usuario.RefreshTokenExpiryTime > DateTime.UtcNow);
        }

        [Fact]
        public async Task Login_ComUsuarioInexistente_DeveRetornarUnauthorized()
        {
            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);

            var controller = new AuthController(userManagerMock.Object, Mock.Of<ITokenService>(), CriarConfiguracao());
            var model = new LoginModel { Username = "nao.existe", Password = "qualquer" };

            var resultado = await controller.Login(model);

            Assert.IsType<UnauthorizedResult>(resultado);
        }

        [Fact]
        public async Task Login_ComSenhaErrada_DeveRetornarUnauthorized()
        {
            var usuario = new ApplicationUser { Id = "id-1", UserName = "usuario.valido" };
            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync("usuario.valido")).ReturnsAsync(usuario);
            userManagerMock.Setup(m => m.CheckPasswordAsync(usuario, It.IsAny<string>())).ReturnsAsync(false);

            var controller = new AuthController(userManagerMock.Object, Mock.Of<ITokenService>(), CriarConfiguracao());
            var model = new LoginModel { Username = "usuario.valido", Password = "senha-errada" };

            var resultado = await controller.Login(model);

            Assert.IsType<UnauthorizedResult>(resultado);
        }

        [Fact]
        public async Task RefreshToken_ComTokenERefreshTokenValidos_DeveRetornarNovoTokenModel()
        {
            var usuario = new ApplicationUser
            {
                Id = "id-1",
                UserName = "usuario.valido",
                RefreshToken = "refresh-antigo",
                RefreshTokenExpiryTime = DateTime.UtcNow.AddMinutes(30),
            };

            // GetPrincipalFromExpiredToken (mockado abaixo) simula o que o TokenService
            // real devolveria a partir de um access token expirado, mas ainda assinado
            // corretamente — é o que o AuthController usa pra descobrir de quem é o
            // refresh token, sem precisar de outro parâmetro no corpo da requisição.
            var principal = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim(ClaimTypes.Name, "usuario.valido") }, "TestAuth"));

            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync("usuario.valido")).ReturnsAsync(usuario);
            userManagerMock.Setup(m => m.UpdateAsync(usuario)).ReturnsAsync(IdentityResult.Success);

            var tokenServiceMock = new Mock<ITokenService>();
            tokenServiceMock
                .Setup(t => t.GetPrincipalFromExpiredToken("access-token-expirado", It.IsAny<IConfiguration>()))
                .Returns(principal);
            tokenServiceMock
                .Setup(t => t.GenerateAccessToken(It.IsAny<IEnumerable<Claim>>(), It.IsAny<IConfiguration>()))
                .Returns(CriarTokenFake());
            tokenServiceMock.Setup(t => t.GenerateRefreshToken()).Returns("refresh-novo");

            var controller = new AuthController(userManagerMock.Object, tokenServiceMock.Object, CriarConfiguracao());
            var model = new TokenModel { AccessToken = "access-token-expirado", RefreshToken = "refresh-antigo" };

            var resultado = await controller.RefreshToken(model);

            var ok = Assert.IsType<OkObjectResult>(resultado);
            var token = Assert.IsType<TokenModel>(ok.Value);
            Assert.Equal("refresh-novo", token.RefreshToken);
            Assert.Equal("refresh-novo", usuario.RefreshToken);
        }

        [Fact]
        public async Task RefreshToken_ComRefreshTokenDivergenteDoSalvo_DeveRetornarBadRequestSemAtualizarUsuario()
        {
            var usuario = new ApplicationUser
            {
                Id = "id-1",
                UserName = "usuario.valido",
                RefreshToken = "refresh-de-verdade",
                RefreshTokenExpiryTime = DateTime.UtcNow.AddMinutes(30),
            };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim(ClaimTypes.Name, "usuario.valido") }, "TestAuth"));

            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync("usuario.valido")).ReturnsAsync(usuario);

            var tokenServiceMock = new Mock<ITokenService>();
            tokenServiceMock
                .Setup(t => t.GetPrincipalFromExpiredToken(It.IsAny<string>(), It.IsAny<IConfiguration>()))
                .Returns(principal);

            var controller = new AuthController(userManagerMock.Object, tokenServiceMock.Object, CriarConfiguracao());
            // O refresh token enviado não bate com o que está salvo pro usuário — simula
            // um token roubado/adulterado, ou simplesmente já substituído por um login
            // mais recente em outro dispositivo.
            var model = new TokenModel { AccessToken = "access-token-expirado", RefreshToken = "refresh-token-errado" };

            var resultado = await controller.RefreshToken(model);

            Assert.IsType<BadRequestObjectResult>(resultado);
            userManagerMock.Verify(m => m.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Never);
        }

        [Fact]
        public async Task RefreshToken_ComRefreshTokenJaExpirado_DeveRetornarBadRequest()
        {
            var usuario = new ApplicationUser
            {
                Id = "id-1",
                UserName = "usuario.valido",
                RefreshToken = "refresh-vencido",
                RefreshTokenExpiryTime = DateTime.UtcNow.AddMinutes(-5), // já venceu
            };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim(ClaimTypes.Name, "usuario.valido") }, "TestAuth"));

            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync("usuario.valido")).ReturnsAsync(usuario);

            var tokenServiceMock = new Mock<ITokenService>();
            tokenServiceMock
                .Setup(t => t.GetPrincipalFromExpiredToken(It.IsAny<string>(), It.IsAny<IConfiguration>()))
                .Returns(principal);

            var controller = new AuthController(userManagerMock.Object, tokenServiceMock.Object, CriarConfiguracao());
            var model = new TokenModel { AccessToken = "access-token-expirado", RefreshToken = "refresh-vencido" };

            var resultado = await controller.RefreshToken(model);

            Assert.IsType<BadRequestObjectResult>(resultado);
        }

        [Fact]
        public async Task Revoke_ComUsuarioExistente_DeveLimparRefreshTokenERetornarNoContent()
        {
            var usuario = new ApplicationUser { Id = "id-1", UserName = "usuario.valido", RefreshToken = "refresh-ativo" };
            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync("usuario.valido")).ReturnsAsync(usuario);
            userManagerMock.Setup(m => m.UpdateAsync(usuario)).ReturnsAsync(IdentityResult.Success);

            var controller = new AuthController(userManagerMock.Object, Mock.Of<ITokenService>(), CriarConfiguracao());

            var resultado = await controller.Revoke("usuario.valido");

            Assert.IsType<NoContentResult>(resultado);
            Assert.Null(usuario.RefreshToken);
        }

        [Fact]
        public async Task Revoke_ComUsuarioInexistente_DeveRetornarBadRequest()
        {
            var userManagerMock = CriarUserManagerMock();
            userManagerMock.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);

            var controller = new AuthController(userManagerMock.Object, Mock.Of<ITokenService>(), CriarConfiguracao());

            var resultado = await controller.Revoke("nao.existe");

            Assert.IsType<BadRequestObjectResult>(resultado);
        }
    }
}

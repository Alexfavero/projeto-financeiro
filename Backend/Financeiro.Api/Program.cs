using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.DTOs.Mappings;
using Financeiro.Api.Extensions;
using Financeiro.Api.Repositories.Implementations;
using Financeiro.Api.Repositories.Interfaces;
using Financeiro.Api.Services.Implementations;
using Financeiro.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // botão "Authorize" no Swagger UI, para colar o Bearer token e testar
    // os endpoints protegidos com [Authorize] direto pela interface.
    // A partir do Swashbuckle.AspNetCore v10 (Microsoft.OpenApi 2.x), os tipos
    // saíram do namespace Microsoft.OpenApi.Models e foram pro Microsoft.OpenApi
    // direto; o esquema certo agora é SecuritySchemeType.Http (não mais ApiKey +
    // ParameterLocation.Header, que era o jeito da v6), e AddSecurityRequirement
    // referencia o esquema por um delegate (document => ...) em vez do antigo
    // OpenApiReference/ReferenceType.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Informe apenas o token, sem o prefixo \"Bearer \" — o Swagger adiciona sozinho. Ex.: eyJhbGciOi..."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

// necessário para o AppDbContext conseguir ler o usuário logado (isolamento multiusuário)
builder.Services.AddHttpContextAccessor();

// CORS: só as origens do front-end (React) podem chamar a API a partir do navegador.
// Lista configurável em appsettings, porque muda entre ambiente local e produção.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              // AllowAnyHeader() só libera o que o navegador pode ENVIAR; sem isso,
              // o header de resposta X-Pagination (listagens paginadas) fica
              // invisível pro JavaScript do front-end em requisição cross-origin.
              .WithExposedHeaders("X-Pagination");
    });
});

// Rate limiting: limite geral por IP para toda a API, e um limite mais apertado
// só para os endpoints de autenticação (proteção contra força bruta no login).
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>().AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// authentication + jwt
var secretKey = builder.Configuration["JWT:SecretKey"]
    ?? throw new ArgumentException("Chave secreta do JWT não configurada!");

builder.Services.AddAuthorization();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.Zero,
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(secretKey))
    };
});

string mySqlConnection = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(mySqlConnection, ServerVersion.AutoDetect(mySqlConnection)));
//Registro UnitOfWork
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

//Registro repositórios específicos
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IContaAPagarRepository, ContaAPagarRepository>();
builder.Services.AddScoped<IContaAReceberRepository, ContaAReceberRepository>();
builder.Services.AddScoped<IFornecedorRepository, FornecedorRepository>();
builder.Services.AddScoped<IParcelaRepository, ParcelaRepository>();

//Registro repositório genérico
builder.Services.AddScoped(typeof(IRepository<>), typeof(BaseRepository<>));

//Registro do serviço de token (JWT)
builder.Services.AddScoped<ITokenService, TokenService>();

//Registro do serviço de previsão de gastos e recebimentos
builder.Services.AddScoped<IPrevisaoService, PrevisaoService>();

//Registro do serviço de relatórios
builder.Services.AddScoped<IRelatorioService, RelatorioService>();

//Automapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.ConfigureExceptionHandler();
}

app.UseHttpsRedirection();

app.UseCors("FrontendPolicy");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

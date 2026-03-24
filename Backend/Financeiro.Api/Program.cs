using Financeiro.Api.Context;
using Financeiro.Api.DTOs.Mappings;
using Financeiro.Api.Repositories.Implementations;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

//Registro repositorio genérico
builder.Services.AddScoped(typeof(IRepository<>), typeof(BaseRepository<>));

//Automapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

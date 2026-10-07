using FlowPilot.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

namespace FlowPilot.Api.Tests;

public sealed class PostgreSqlApiFactory(string connectionString) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", connectionString);
    }
}

public sealed class PostgreSqlApiFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder("postgres:16.14-alpine")
        .WithDatabase("flowpilot_tests")
        .WithUsername("flowpilot_tests")
        .WithPassword(Guid.NewGuid().ToString("N"))
        .Build();

    public PostgreSqlApiFactory Factory { get; private set; } = null!;
    public string ConnectionString => _database.GetConnectionString();

    public async ValueTask InitializeAsync()
    {
        await _database.StartAsync(TestContext.Current.CancellationToken);
        Factory = new PostgreSqlApiFactory(ConnectionString);

        await using var scope = Factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<FlowPilotDbContext>();
        await dbContext.Database.MigrateAsync(TestContext.Current.CancellationToken);
    }

    public async ValueTask DisposeAsync()
    {
        if (Factory is not null)
        {
            await Factory.DisposeAsync();
        }

        await _database.DisposeAsync();
    }
}

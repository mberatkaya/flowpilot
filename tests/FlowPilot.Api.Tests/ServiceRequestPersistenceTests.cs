using System.Net;
using System.Net.Http.Json;
using FlowPilot.Api.ServiceRequests;
using Npgsql;
using Xunit;

namespace FlowPilot.Api.Tests;

public class ServiceRequestPersistenceTests(PostgreSqlApiFixture fixture)
    : IClassFixture<PostgreSqlApiFixture>
{
    private static CreateServiceRequest FictionalRequest() => new(
        "Test User",
        "test@example.com",
        ServiceTypes.WorkflowAutomation,
        "This is a fictional evaluation request.");

    [Fact]
    public async Task PostReturns201AndPersistsAllFieldsInPostgreSql()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        using var client = fixture.Factory.CreateClient();
        var request = FictionalRequest();
        var before = DateTimeOffset.UtcNow;

        using var response = await client.PostAsJsonAsync("/api/requests", request, cancellationToken);
        var after = DateTimeOffset.UtcNow;

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ServiceRequestResponse>(cancellationToken);
        Assert.NotNull(created);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal(TimeSpan.Zero, created.CreatedAt.Offset);
        Assert.InRange(created.CreatedAt, before, after);

        // Read through a new, independent connection, not EF's tracked entity.
        await using var connection = new NpgsqlConnection(fixture.ConnectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT "Name", "Email", "ServiceType", "Description", "CreatedAt"
            FROM "ServiceRequests" WHERE "Id" = @id
            """;
        command.Parameters.AddWithValue("id", created.Id);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        Assert.True(await reader.ReadAsync(cancellationToken));
        Assert.Equal(request.Name, reader.GetString(0));
        Assert.Equal(request.Email, reader.GetString(1));
        Assert.Equal(request.ServiceType, reader.GetString(2));
        Assert.Equal(request.Description, reader.GetString(3));
        // PostgreSQL timestamps have microsecond precision; .NET uses 100ns ticks.
        Assert.InRange((created.CreatedAt.UtcDateTime - reader.GetDateTime(4)).Ticks, 0, 9);
        Assert.False(await reader.ReadAsync(cancellationToken));
    }

    [Fact]
    public async Task PostIgnoresClientProvidedIdAndCreationTime()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        using var client = fixture.Factory.CreateClient();
        var request = FictionalRequest();
        var before = DateTimeOffset.UtcNow;
        var clientId = Guid.NewGuid();

        using var response = await client.PostAsJsonAsync("/api/requests", new
        {
            request.Name, request.Email, request.ServiceType, request.Description,
            Id = clientId,
            CreatedAt = DateTimeOffset.UnixEpoch
        }, cancellationToken);
        var after = DateTimeOffset.UtcNow;

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ServiceRequestResponse>(cancellationToken);
        Assert.NotNull(created);
        Assert.NotEqual(clientId, created.Id);
        Assert.InRange(created.CreatedAt, before, after);

        await using var connection = new NpgsqlConnection(fixture.ConnectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT \"CreatedAt\" FROM \"ServiceRequests\" WHERE \"Id\" = @id";
        command.Parameters.AddWithValue("id", created.Id);
        var stored = Assert.IsType<DateTime>(await command.ExecuteScalarAsync(cancellationToken));
        Assert.NotEqual(DateTimeOffset.UnixEpoch.UtcDateTime, stored);
        Assert.InRange((created.CreatedAt.UtcDateTime - stored).Ticks, 0, 9);

        await using var clientIdCommand = connection.CreateCommand();
        clientIdCommand.CommandText = "SELECT COUNT(*) FROM \"ServiceRequests\" WHERE \"Id\" = @id";
        clientIdCommand.Parameters.AddWithValue("id", clientId);
        Assert.Equal(0L, await clientIdCommand.ExecuteScalarAsync(cancellationToken));
    }

    [Theory]
    [InlineData("Testing")]
    [InlineData("Development")]
    public async Task DatabaseFailureDoesNotReturnSuccessOrExposeInternals(string environment)
    {
        var connectionString = new NpgsqlConnectionStringBuilder(fixture.ConnectionString)
        {
            Database = "missing_" + Guid.NewGuid().ToString("N")
        };
        await using var factory = new PostgreSqlApiFactory(connectionString.ConnectionString, environment);
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync(
            "/api/requests", FictionalRequest(), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.False(response.IsSuccessStatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var document = System.Text.Json.JsonDocument.Parse(body);
        var problem = document.RootElement;
        Assert.Equal(500, problem.GetProperty("status").GetInt32());
        Assert.Equal("An unexpected error occurred.", problem.GetProperty("title").GetString());
        Assert.Equal("The request could not be completed. Please try again later.",
            problem.GetProperty("detail").GetString());
        Assert.False(problem.TryGetProperty("id", out _));
        Assert.DoesNotContain(connectionString.Database, body);
        Assert.DoesNotContain(connectionString.Password!, body);
        Assert.DoesNotContain("Npgsql", body);
        Assert.DoesNotContain("Exception", body);
        Assert.DoesNotContain("stack", body, StringComparison.OrdinalIgnoreCase);
    }
}

using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FlowPilot.Api.ServiceRequests;
using Npgsql;
using Xunit;

namespace FlowPilot.Api.Tests;

public class ServiceRequestValidationTests(PostgreSqlApiFixture fixture)
    : IClassFixture<PostgreSqlApiFixture>
{
    public static TheoryData<string, string?> InvalidFieldValues => new()
    {
        { "name", "" },
        { "name", " \t\r\n " },
        { "name", null },
        { "name", new string('a', 201) },
        { "email", "" },
        { "email", " \t " },
        { "email", null },
        { "email", "SENSITIVE_INPUT_MARKER" },
        { "email", "test@" },
        { "email", new string('a', 309) + "@example.com" },
        { "serviceType", "unsupported-service" },
        { "serviceType", "" },
        { "serviceType", null },
        { "serviceType", "WORKFLOW-AUTOMATION" },
        { "serviceType", " workflow-automation " },
        { "description", "" },
        { "description", " \t\r\n " },
        { "description", null },
        { "description", "123456789" },
        { "description", new string('a', 4001) }
    };

    private static Dictionary<string, string?> FictionalRequest() => new()
    {
        ["name"] = "Test User",
        ["email"] = "test@example.com",
        ["serviceType"] = "workflow-automation",
        ["description"] = "This is a fictional evaluation request."
    };

    [Theory]
    [MemberData(nameof(InvalidFieldValues))]
    public async Task InvalidFieldReturns400AndDoesNotInsert(string field, string? value)
    {
        var payload = FictionalRequest();
        payload[field] = value;

        await AssertInvalidRequestDoesNotInsert(payload, field);
    }

    [Theory]
    [InlineData("name")]
    [InlineData("email")]
    [InlineData("serviceType")]
    [InlineData("description")]
    public async Task MissingFieldReturns400AndDoesNotInsert(string field)
    {
        var payload = FictionalRequest();
        payload.Remove(field);

        await AssertInvalidRequestDoesNotInsert(payload, field);
    }

    [Fact]
    public async Task MultipleInvalidFieldsReturnAllFieldErrorsWithoutSensitiveValues()
    {
        using var client = fixture.Factory.CreateClient();
        var before = await CountRequestsAsync();
        using var response = await client.PostAsJsonAsync("/api/requests", new
        {
            name = " ", email = "SENSITIVE_INPUT_MARKER",
            serviceType = "SENSITIVE_INPUT_MARKER", description = " "
        }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(body);
        var fields = document.RootElement.GetProperty("errors").EnumerateObject()
            .Select(error => error.Name).Order().ToArray();
        Assert.Equal(new[] { "description", "email", "name", "serviceType" }, fields);
        Assert.DoesNotContain("SENSITIVE_INPUT_MARKER", body);
        Assert.DoesNotContain(new NpgsqlConnectionStringBuilder(fixture.ConnectionString).Password!, body);
        Assert.Equal(before, await CountRequestsAsync());
    }

    [Theory]
    [InlineData("workflow-automation")]
    [InlineData("system-integration")]
    [InlineData("data-reporting")]
    [InlineData("custom-software")]
    public async Task SupportedServicePersistsTrimmedFields(string serviceType)
    {
        var payload = FictionalRequest();
        payload["name"] = " \tTest User\r\n ";
        payload["email"] = " \ttest@example.com\r\n ";
        payload["serviceType"] = serviceType;
        payload["description"] = " \tThis is a fictional evaluation request.\r\n ";

        await AssertValidRequestIsStored(payload, FictionalRequest()["name"]!,
            FictionalRequest()["email"]!, serviceType, FictionalRequest()["description"]!);
    }

    [Theory]
    [InlineData("name", 200)]
    [InlineData("email", 320)]
    [InlineData("description", 10)]
    [InlineData("description", 4000)]
    public async Task LengthBoundaryIsAcceptedAfterTrimming(string field, int length)
    {
        var payload = FictionalRequest();
        var value = field == "email"
            ? new string('a', length - "@example.com".Length) + "@example.com"
            : new string('a', length);
        payload[field] = " \t" + value + "\r\n ";

        await AssertValidRequestIsStored(payload, payload["name"]!.Trim(), payload["email"]!.Trim(),
            payload["serviceType"]!, payload["description"]!.Trim());
    }

    [Theory]
    [InlineData("")]
    [InlineData("null")]
    [InlineData("{")]
    [InlineData("{\"name\":42}")]
    public async Task MalformedBodyReturns400AndDoesNotInsert(string body)
    {
        // Exercise Development too: model binding must not turn bad input into a 500.
        await using var factory = new PostgreSqlApiFactory(fixture.ConnectionString, "Development");
        using var client = factory.CreateClient();
        var before = await CountRequestsAsync();
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var response = await client.PostAsync("/api/requests", content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        Assert.Equal(400, problem.GetProperty("status").GetInt32());
        Assert.Equal("Bad request.", problem.GetProperty("title").GetString());
        Assert.Equal(before, await CountRequestsAsync());
    }

    private async Task AssertInvalidRequestDoesNotInsert(Dictionary<string, string?> payload, string field)
    {
        using var client = fixture.Factory.CreateClient();
        var before = await CountRequestsAsync();
        using var response = await client.PostAsJsonAsync("/api/requests", payload, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        Assert.Equal(400, problem.GetProperty("status").GetInt32());
        Assert.Equal("Validation failed.", problem.GetProperty("title").GetString());
        Assert.NotEmpty(problem.GetProperty("errors").GetProperty(field).EnumerateArray());
        Assert.Equal(before, await CountRequestsAsync());
    }

    private async Task AssertValidRequestIsStored(Dictionary<string, string?> payload,
        string name, string email, string serviceType, string description)
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        using var client = fixture.Factory.CreateClient();
        using var response = await client.PostAsJsonAsync("/api/requests", payload, cancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ServiceRequestResponse>(cancellationToken);
        Assert.NotNull(created);

        await using var connection = new NpgsqlConnection(fixture.ConnectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT "Name", "Email", "ServiceType", "Description"
            FROM "ServiceRequests" WHERE "Id" = @id
            """;
        command.Parameters.AddWithValue("id", created.Id);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        Assert.True(await reader.ReadAsync(cancellationToken));
        Assert.Equal(name, reader.GetString(0));
        Assert.Equal(email, reader.GetString(1));
        Assert.Equal(serviceType, reader.GetString(2));
        Assert.Equal(description, reader.GetString(3));
    }

    private async Task<long> CountRequestsAsync()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        await using var connection = new NpgsqlConnection(fixture.ConnectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM \"ServiceRequests\"";
        return (long)(await command.ExecuteScalarAsync(cancellationToken))!;
    }
}

using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace FlowPilot.Api.Tests;

public class ApiHostTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ApiHostTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task HostStartsWithoutDatabaseConfiguration()
    {
        using var client = _factory.CreateClient();
        using var response = await client.GetAsync("/", TestContext.Current.CancellationToken);

        // The empty API host should start successfully without exposing a route.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}

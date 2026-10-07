using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace FlowPilot.Api.Tests;

public sealed class ProductionStaticHostingTests : IClassFixture<PostgreSqlApiFixture>, IDisposable
{
    private const string PageMarker = "FlowPilot production hosting test";
    private readonly string _webRoot = Path.Combine(Path.GetTempPath(), "flowpilot-hosting-" + Guid.NewGuid().ToString("N"));
    private readonly WebApplicationFactory<Program> _factory;

    public ProductionStaticHostingTests(PostgreSqlApiFixture fixture)
    {
        Directory.CreateDirectory(Path.Combine(_webRoot, "assets"));
        File.WriteAllText(Path.Combine(_webRoot, "index.html"), $"<!doctype html><html><body>{PageMarker}</body></html>");
        File.WriteAllText(Path.Combine(_webRoot, "assets", "hosting-test.css"), "body { color: green; }");
        _factory = new PostgreSqlApiFactory(fixture.ConnectionString, "Production")
            .WithWebHostBuilder(builder => builder.UseWebRoot(_webRoot));
    }

    [Fact]
    public async Task ProductionServesTheLandingPageAndItsAssetsOnTheApiHost()
    {
        using var client = _factory.CreateClient();
        using var page = await client.GetAsync("/", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, page.StatusCode);
        Assert.Equal("text/html", page.Content.Headers.ContentType?.MediaType);
        Assert.Contains(PageMarker, await page.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));

        using var asset = await client.GetAsync("/assets/hosting-test.css", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, asset.StatusCode);
        Assert.Equal("text/css", asset.Content.Headers.ContentType?.MediaType);
        Assert.Equal("body { color: green; }", await asset.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    [Theory]
    [InlineData("/api/missing")]
    [InlineData("/assets/missing.js")]
    [InlineData("/does-not-exist")]
    public async Task UnknownRoutesDoNotReturnTheLandingPage(string path)
    {
        using var client = _factory.CreateClient();
        using var response = await client.GetAsync(path, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.DoesNotContain(PageMarker, await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    public void Dispose()
    {
        _factory.Dispose();
        Directory.Delete(_webRoot, recursive: true);
    }
}

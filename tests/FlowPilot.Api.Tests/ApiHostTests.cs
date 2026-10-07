using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace FlowPilot.Api.Tests;

public class ApiHostTests
{
    [Fact]
    public void MissingConnectionStringFailsWithConfigurationMessage()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseEnvironment("Testing").UseSetting("ConnectionStrings:Default", ""));

        var error = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());
        Assert.Contains("ConnectionStrings:Default", error.Message);
    }
}

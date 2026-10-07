using FlowPilot.Api.Data;
using FlowPilot.Api.ServiceRequests;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Configure ConnectionStrings:Default using environment variables or .NET User Secrets.");
}

builder.Services.AddDbContext<FlowPilotDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<ServiceRequestService>();
builder.Services.AddProblemDetails();

var app = builder.Build();

// Database failures reach the standard 500 handler; they never become a 201 response.
app.UseExceptionHandler();
app.MapServiceRequestEndpoints();

app.Run();

// Exposes the entry point to the integration test host.
public partial class Program { }

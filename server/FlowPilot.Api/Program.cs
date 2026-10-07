using System.Text.Json;
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
builder.Services.AddValidation();
// Invalid JSON/types must remain client errors, including in Development.
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = false);
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
{
    var problem = context.ProblemDetails;
    problem.Instance = context.HttpContext.Request.Path;

    if (problem is HttpValidationProblemDetails validation)
    {
        problem.Title = "Validation failed.";
        var errors = validation.Errors.ToArray();
        validation.Errors.Clear();
        foreach (var (field, messages) in errors)
        {
            validation.Errors[JsonNamingPolicy.CamelCase.ConvertName(field)] = messages;
        }
    }
    else if (problem.Status == StatusCodes.Status400BadRequest)
    {
        problem.Title = "Bad request.";
        problem.Detail = "The request body must contain a valid JSON object with string fields.";
    }
    else if (problem.Status >= StatusCodes.Status500InternalServerError)
    {
        // Public responses never expose exception messages or database credentials.
        problem.Title = "An unexpected error occurred.";
        problem.Detail = "The request could not be completed. Please try again later.";
        problem.Extensions.Clear();
    }
});

var app = builder.Build();

// Database failures reach the standard 500 handler; they never become a 201 response.
app.UseExceptionHandler();
app.UseStatusCodePages();

// The production package contains the React build in wwwroot. Development uses Vite.
// Keep unknown API routes as 404; this landing page does not need an SPA fallback.
if (Directory.Exists(app.Environment.WebRootPath))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.MapServiceRequestEndpoints();

app.Run();

// Exposes the entry point to the integration test host.
public partial class Program { }

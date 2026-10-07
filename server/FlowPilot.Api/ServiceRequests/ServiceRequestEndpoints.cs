using Microsoft.AspNetCore.Http.HttpResults;

namespace FlowPilot.Api.ServiceRequests;

public static class ServiceRequestEndpoints
{
    public static IEndpointRouteBuilder MapServiceRequestEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/requests", CreateAsync);
        return endpoints;
    }

    private static async Task<Created<ServiceRequestResponse>> CreateAsync(
        CreateServiceRequest request,
        ServiceRequestService service,
        CancellationToken cancellationToken)
    {
        var response = await service.CreateAsync(request, cancellationToken);

        // No Location URL is advertised until a GET resource endpoint exists.
        return TypedResults.Created(uri: (string?)null, value: response);
    }
}

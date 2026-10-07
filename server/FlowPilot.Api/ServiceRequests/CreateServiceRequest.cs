namespace FlowPilot.Api.ServiceRequests;

// Only client-owned fields are accepted. Id and CreatedAt belong to the server.
public sealed record CreateServiceRequest(
    string Name,
    string Email,
    string ServiceType,
    string Description);

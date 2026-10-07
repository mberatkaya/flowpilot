namespace FlowPilot.Api.ServiceRequests;

public class ServiceRequest
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string ServiceType { get; set; }
    public required string Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

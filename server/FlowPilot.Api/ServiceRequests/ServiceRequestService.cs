using FlowPilot.Api.Data;

namespace FlowPilot.Api.ServiceRequests;

public sealed class ServiceRequestService(FlowPilotDbContext dbContext)
{
    public async Task<ServiceRequestResponse> CreateAsync(
        CreateServiceRequest request, CancellationToken cancellationToken)
    {
        var entity = new ServiceRequest
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            ServiceType = request.ServiceType,
            Description = request.Description,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.ServiceRequests.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ServiceRequestResponse(entity.Id, entity.CreatedAt);
    }
}

using FlowPilot.Api.ServiceRequests;
using Microsoft.EntityFrameworkCore;

namespace FlowPilot.Api.Data;

public class FlowPilotDbContext(DbContextOptions<FlowPilotDbContext> options) : DbContext(options)
{
    public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new ServiceRequestConfiguration());
    }
}

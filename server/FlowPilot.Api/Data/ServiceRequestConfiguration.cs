using FlowPilot.Api.ServiceRequests;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowPilot.Api.Data;

public class ServiceRequestConfiguration : IEntityTypeConfiguration<ServiceRequest>
{
    public void Configure(EntityTypeBuilder<ServiceRequest> builder)
    {
        builder.ToTable("ServiceRequests");
        builder.HasKey(request => request.Id);
        builder.Property(request => request.Id).ValueGeneratedNever();
        builder.Property(request => request.Name).IsRequired().HasMaxLength(ServiceRequestLimits.NameMaxLength);
        builder.Property(request => request.Email).IsRequired().HasMaxLength(ServiceRequestLimits.EmailMaxLength);
        builder.Property(request => request.ServiceType).IsRequired().HasMaxLength(ServiceRequestLimits.ServiceTypeMaxLength);
        builder.Property(request => request.Description).IsRequired().HasMaxLength(ServiceRequestLimits.DescriptionMaxLength);
        builder.Property(request => request.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
    }
}

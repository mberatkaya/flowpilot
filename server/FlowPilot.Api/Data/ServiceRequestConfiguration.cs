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
        builder.Property(request => request.Name).IsRequired().HasMaxLength(200);
        builder.Property(request => request.Email).IsRequired().HasMaxLength(320);
        builder.Property(request => request.ServiceType).IsRequired().HasMaxLength(64);
        builder.Property(request => request.Description).IsRequired().HasMaxLength(4000);
        builder.Property(request => request.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
    }
}

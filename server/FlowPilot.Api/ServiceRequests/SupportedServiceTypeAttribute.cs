using System.ComponentModel.DataAnnotations;

namespace FlowPilot.Api.ServiceRequests;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class SupportedServiceTypeAttribute : ValidationAttribute
{
    public SupportedServiceTypeAttribute() : base("ServiceType must be one of the supported values.") { }

    public override bool IsValid(object? value) =>
        value is string serviceType && ServiceTypes.Supported.Contains(serviceType);
}

using System.ComponentModel.DataAnnotations;

namespace FlowPilot.Api.ServiceRequests;

// Only client-owned fields are accepted. Id and CreatedAt belong to the server.
public sealed record CreateServiceRequest
{
    public CreateServiceRequest(string? name, string? email, string? serviceType, string? description)
    {
        // Normalize before the built-in endpoint validation filter runs.
        Name = name?.Trim() ?? string.Empty;
        Email = email?.Trim() ?? string.Empty;
        ServiceType = serviceType ?? string.Empty;
        Description = description?.Trim() ?? string.Empty;
    }

    [Required(ErrorMessage = "Name is required.")]
    [MaxLength(ServiceRequestLimits.NameMaxLength, ErrorMessage = "Name must be at most {1} characters.")]
    public string Name { get; }

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email must be a valid email address.")]
    [MaxLength(ServiceRequestLimits.EmailMaxLength, ErrorMessage = "Email must be at most {1} characters.")]
    public string Email { get; }

    [SupportedServiceType]
    public string ServiceType { get; }

    [Required(ErrorMessage = "Description is required.")]
    [StringLength(ServiceRequestLimits.DescriptionMaxLength,
        MinimumLength = ServiceRequestLimits.DescriptionMinLength,
        ErrorMessage = "Description must be between {2} and {1} characters.")]
    public string Description { get; }
}

using System.Collections.Frozen;

namespace FlowPilot.Api.ServiceRequests;

public static class ServiceTypes
{
    public const string WorkflowAutomation = "workflow-automation";
    public const string SystemIntegration = "system-integration";
    public const string DataReporting = "data-reporting";
    public const string CustomSoftware = "custom-software";

    // Shared source of accepted values for server-side validation.
    public static IReadOnlySet<string> Supported { get; } = new[]
    {
        WorkflowAutomation, SystemIntegration, DataReporting, CustomSoftware
    }.ToFrozenSet(StringComparer.Ordinal);
}

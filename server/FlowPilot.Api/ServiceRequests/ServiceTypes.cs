using System.Collections.Frozen;

namespace FlowPilot.Api.ServiceRequests;

public static class ServiceTypes
{
    public const string WorkflowAutomation = "workflow-automation";
    public const string SystemIntegration = "system-integration";
    public const string DataReporting = "data-reporting";
    public const string CustomSoftware = "custom-software";

    // Sprint 3 validation will use this single source of supported values.
    public static IReadOnlySet<string> Supported { get; } = new[]
    {
        WorkflowAutomation, SystemIntegration, DataReporting, CustomSoftware
    }.ToFrozenSet(StringComparer.Ordinal);
}

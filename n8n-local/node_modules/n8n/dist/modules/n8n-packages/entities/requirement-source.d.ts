import type { PackageRequirementConsumer } from '../spec/requirements.schema';
export type AgentRequirementSource = {
    agentId: string;
    projectId: string;
};
export type RequirementSource = {
    workflowId: string;
} | AgentRequirementSource;
export interface RequirementUsage {
    usedBy: PackageRequirementConsumer[];
}
export declare function addRequirementUsage(usage: RequirementUsage, source: RequirementSource): void;
export declare function groupRequirementUsage<T extends RequirementSource>(requirements: T[], keyOf: (requirement: T) => string): Map<string, RequirementUsage>;

import type { DependencyResourceType } from '@n8n/api-types';
export interface AgentUsageProvider {
    findAgentUsages(resourceType: DependencyResourceType, resourceIds: string[]): Promise<Array<{
        agentId: string;
        resourceId: string;
    }>>;
    findAgentSummaries(agentIds: string[]): Promise<Array<{
        id: string;
        name: string;
        projectId: string;
    }>>;
}
export declare class AgentUsageProviderProxy implements AgentUsageProvider {
    private provider;
    registerProvider(provider: AgentUsageProvider): void;
    findAgentUsages(resourceType: DependencyResourceType, resourceIds: string[]): Promise<Array<{
        agentId: string;
        resourceId: string;
    }>>;
    findAgentSummaries(agentIds: string[]): Promise<Array<{
        id: string;
        name: string;
        projectId: string;
    }>>;
}

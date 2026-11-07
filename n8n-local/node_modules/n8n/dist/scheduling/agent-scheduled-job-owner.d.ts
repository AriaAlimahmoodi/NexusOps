import { ModuleRegistry } from '@n8n/backend-common';
import type { ScheduledJobOwner, ScheduledJobOwnerRef } from '@n8n/db';
import type { ScheduledJobOwnerResolver } from '@n8n/scheduler';
export declare class AgentScheduledJobOwner implements ScheduledJobOwnerResolver {
    private readonly moduleRegistry;
    readonly ownerType: "agent";
    constructor(moduleRegistry: ModuleRegistry);
    member(agentId: string, taskId: string): ScheduledJobOwner;
    ref(agentId: string): ScheduledJobOwnerRef;
    findExisting(ownerIds: string[]): Promise<Set<string>>;
}

import type { ScheduledJobOwner, ScheduledJobOwnerRef } from '@n8n/db';
import { WorkflowPublishedVersionRepository } from '@n8n/db';
import type { ScheduledJobOwnerResolver } from '@n8n/scheduler';
export declare class WorkflowScheduledJobOwner implements ScheduledJobOwnerResolver {
    private readonly publishedVersions;
    readonly ownerType: "workflow";
    constructor(publishedVersions: WorkflowPublishedVersionRepository);
    member(workflowId: string, nodeId: string): ScheduledJobOwner;
    ref(workflowId: string): ScheduledJobOwnerRef;
    findExisting(ownerIds: string[]): Promise<Set<string>>;
}

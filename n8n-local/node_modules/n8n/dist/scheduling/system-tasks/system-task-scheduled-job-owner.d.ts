import type { ScheduledJobOwner } from '@n8n/db';
import { ScheduledJobRepository } from '@n8n/db';
import type { ScheduledJobOwnerResolver } from '@n8n/scheduler';
export declare class SystemTaskScheduledJobOwner implements ScheduledJobOwnerResolver {
    private readonly jobs;
    readonly ownerType: "system-task";
    private readonly durableTaskNames;
    constructor(jobs: ScheduledJobRepository);
    owner(taskName: string): ScheduledJobOwner;
    declareDurable(taskName: string): void;
    findExisting(ownerIds: string[]): Promise<Set<string>>;
    isAlive(ownerId: string, payload: Record<string, unknown>): boolean;
}

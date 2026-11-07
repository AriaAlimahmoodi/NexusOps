import type { InstanceRegistration } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { ClusterCheckResult, ClusterStateDiff } from '@n8n/decorators';
import { ClusterCheckMetadata } from '@n8n/decorators';
import { MessageEventBus } from '../../../eventbus/message-event-bus/message-event-bus';
import { Push } from '../../../push';
import { InstanceRegistryService } from '../instance-registry.service';
type CheckRun = {
    currentState: Map<string, InstanceRegistration>;
    results: Array<{
        checkName: string;
        checkDisplayName?: string;
        result?: ClusterCheckResult;
        failed?: true;
    }>;
};
export declare class CheckService {
    private readonly instanceRegistryService;
    private readonly clusterCheckMetadata;
    private readonly messageEventBus;
    private readonly push;
    private readonly checks;
    private readonly logger;
    constructor(logger: Logger, instanceRegistryService: InstanceRegistryService, clusterCheckMetadata: ClusterCheckMetadata, messageEventBus: MessageEventBus, push: Push);
    init(): void;
    private discoverChecks;
    runChecks(): Promise<CheckRun>;
    private evaluate;
    reconcile(signal: AbortSignal): Promise<void>;
    private processResult;
    private logWarning;
    private emitAuditEvent;
    private broadcastPush;
}
export declare function computeDiff(previousState: ReadonlyMap<string, InstanceRegistration>, currentState: ReadonlyMap<string, InstanceRegistration>): ClusterStateDiff;
export {};

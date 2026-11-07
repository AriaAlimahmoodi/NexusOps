import { Logger } from '@n8n/backend-common';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { TypeAvailabilityPolicyAttachmentRepository } from './database/repositories/type-availability-policy-attachment.repository';
import { TypeAvailabilityPolicyScopeRepository } from './database/repositories/type-availability-policy-scope.repository';
import { type EffectivePolicy, type ProjectEffectivePolicy } from './effective-policy';
export declare const FINGERPRINT_POLL_INTERVAL_MS: number;
export declare class TypeAvailabilityPolicySnapshot {
    private readonly scopeRepository;
    private readonly attachmentRepository;
    private readonly publisher;
    private readonly logger;
    private loaded;
    private queue;
    private pending;
    private pollTimer;
    private polling;
    constructor(scopeRepository: TypeAvailabilityPolicyScopeRepository, attachmentRepository: TypeAvailabilityPolicyAttachmentRepository, publisher: Publisher, logger: Logger);
    read(kind: string, projectId: string | null): EffectivePolicy | null;
    projectScopes(kind: string): ProjectEffectivePolicy[] | null;
    start(): Promise<void>;
    stop(): void;
    refreshAfterWrite(): Promise<void>;
    handleReloadRequest(): Promise<void>;
    reload(): Promise<void>;
    private reloadAndLog;
    private load;
    private poll;
}

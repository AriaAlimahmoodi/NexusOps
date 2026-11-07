import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import type { BuilderUsageItem, TraceStatus } from '@n8n/instance-ai';
import { InstanceSettings } from 'n8n-core';
import { Push } from '../../push';
import { AiService } from '../../services/ai.service';
import { Telemetry } from '../../telemetry';
import { InstanceAiThreadRepository } from './repositories/instance-ai-thread.repository';
export declare class InstanceAiCreditService {
    private readonly aiService;
    private readonly telemetry;
    private readonly instanceSettings;
    private readonly push;
    private readonly threadRepo;
    private readonly logger;
    private readonly claimedRunIds;
    private readonly quotaExhaustedHandlers;
    static readonly CLAIM_DEDUPE_CACHE_SIZE = 1000;
    private static readonly CLAIM_MAX_ATTEMPTS;
    onQuotaExhausted(handler: (user: User) => void): void;
    constructor(logger: Logger, aiService: AiService, telemetry: Telemetry, instanceSettings: InstanceSettings, push: Push, threadRepo: InstanceAiThreadRepository);
    claimRunUsage(user: User, threadId: string, dedupeId: string, usage: BuilderUsageItem[], status: TraceStatus): Promise<number | undefined>;
    private notifyQuotaExhausted;
    private getProxyAuth;
    private claimTokens;
    private claimTokensWithRetry;
    private accumulateThreadCredits;
    private rememberClaimedRunId;
}

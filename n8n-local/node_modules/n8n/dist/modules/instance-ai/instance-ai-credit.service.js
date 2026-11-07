"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InstanceAiCreditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiCreditService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const push_1 = require("../../push");
const ai_service_1 = require("../../services/ai.service");
const telemetry_1 = require("../../telemetry");
const instance_ai_thread_repository_1 = require("./repositories/instance-ai-thread.repository");
let InstanceAiCreditService = InstanceAiCreditService_1 = class InstanceAiCreditService {
    onQuotaExhausted(handler) {
        this.quotaExhaustedHandlers.add(handler);
    }
    constructor(logger, aiService, telemetry, instanceSettings, push, threadRepo) {
        this.aiService = aiService;
        this.telemetry = telemetry;
        this.instanceSettings = instanceSettings;
        this.push = push;
        this.threadRepo = threadRepo;
        this.claimedRunIds = new Set();
        this.quotaExhaustedHandlers = new Set();
        this.logger = logger.scoped('instance-ai');
    }
    async claimRunUsage(user, threadId, dedupeId, usage, status) {
        if (!this.aiService.isProxyEnabled()) {
            this.logger.debug('Skipping Instance AI credit claim: proxy disabled', {
                threadId,
                dedupeId,
            });
            return;
        }
        if (usage.length === 0) {
            this.logger.debug('Skipping Instance AI credit claim: no usage', { threadId, dedupeId });
            return;
        }
        if (this.claimedRunIds.has(dedupeId)) {
            this.logger.debug('Skipping Instance AI credit claim: already claimed', {
                threadId,
                dedupeId,
            });
            return;
        }
        this.rememberClaimedRunId(dedupeId);
        this.logger.debug('Claiming Instance AI credits', { threadId, dedupeId, status, usage });
        let result;
        try {
            result = await this.claimTokensWithRetry(user, threadId, dedupeId, usage);
        }
        catch (error) {
            this.claimedRunIds.delete(dedupeId);
            this.telemetry.track('Builder credits claimed', {
                instance_id: this.instanceSettings.instanceId,
                user_id: user.id,
                thread_id: threadId,
                agent_run_id: dedupeId,
                status,
                success: false,
                error_message: (0, get_error_message_1.getErrorMessage)(error),
                attempted_usage: usage,
            });
            this.logger.warn('Failed to claim Instance AI credits', {
                error: (0, get_error_message_1.getErrorMessage)(error),
                threadId,
                dedupeId,
            });
            return;
        }
        if (typeof result?.delta !== 'number') {
            this.logger.debug('Instance AI credit claim returned no numeric delta', {
                threadId,
                dedupeId,
                result,
            });
            return;
        }
        const { delta, creditsClaimed, creditsQuota } = result;
        if (creditsQuota < 0) {
            throw new n8n_workflow_1.UnexpectedError('Instance AI credit claim returned a negative quota', {
                extra: { threadId, dedupeId, creditsQuota },
            });
        }
        const totalCreditsUsed = await this.accumulateThreadCredits(threadId, delta);
        this.logger.debug('Claimed Instance AI credits', {
            threadId,
            dedupeId,
            status,
            delta,
            creditsClaimed,
            creditsQuota,
            totalCreditsUsed,
        });
        this.push.sendToUsers({
            type: 'updateInstanceAiCredits',
            data: {
                creditsQuota,
                creditsClaimed,
                ...(totalCreditsUsed !== undefined
                    ? { creditsPerThread: { threadId, totalCreditsUsed } }
                    : {}),
            },
        }, [user.id]);
        this.telemetry.track('Builder credits claimed', {
            instance_id: this.instanceSettings.instanceId,
            user_id: user.id,
            thread_id: threadId,
            agent_run_id: dedupeId,
            status,
            success: true,
            credits_used: delta,
            credits_claimed_total: creditsClaimed,
            credits_quota: creditsQuota,
        });
        if (delta > 0) {
            const wasUnder = creditsClaimed - delta < creditsQuota;
            const nowExhausted = creditsClaimed >= creditsQuota;
            if (wasUnder && nowExhausted) {
                this.telemetry.track('User exhausted assistant quota', {
                    instance_id: this.instanceSettings.instanceId,
                    user_id: user.id,
                });
                this.notifyQuotaExhausted(user);
            }
        }
        return delta;
    }
    notifyQuotaExhausted(user) {
        for (const handler of this.quotaExhaustedHandlers) {
            try {
                handler(user);
            }
            catch (error) {
                this.logger.warn('Assistant quota exhaustion handler failed', {
                    userId: user.id,
                    error: (0, get_error_message_1.getErrorMessage)(error),
                });
            }
        }
    }
    async getProxyAuth(user) {
        const client = await this.aiService.getClient();
        const token = await client.getInstanceAiApiProxyToken({ id: user.id }, { userMessageId: (0, nanoid_1.nanoid)() });
        return {
            client,
            headers: { Authorization: `${token.tokenType} ${token.accessToken}` },
        };
    }
    async claimTokens(user, threadId, dedupeId, usage) {
        const { client, headers } = await this.getProxyAuth(user);
        return await client.markInstanceAiTokenUsage({ id: user.id }, headers, {
            dedupeId,
            usage,
            threadId,
        });
    }
    async claimTokensWithRetry(user, threadId, dedupeId, usage) {
        let lastError;
        for (let attempt = 1; attempt <= InstanceAiCreditService_1.CLAIM_MAX_ATTEMPTS; attempt++) {
            try {
                return await this.claimTokens(user, threadId, dedupeId, usage);
            }
            catch (error) {
                lastError = error;
                this.logger.debug('Instance AI credit claim attempt failed', {
                    dedupeId,
                    attempt,
                    maxAttempts: InstanceAiCreditService_1.CLAIM_MAX_ATTEMPTS,
                    error: (0, get_error_message_1.getErrorMessage)(error),
                });
                if (attempt < InstanceAiCreditService_1.CLAIM_MAX_ATTEMPTS) {
                    await (0, sleep_1.sleep)(2 ** (attempt - 1) * 200);
                }
            }
        }
        throw lastError;
    }
    async accumulateThreadCredits(threadId, delta) {
        try {
            const thread = await this.threadRepo.updateThread({
                threadId,
                update: ({ metadata }) => ({
                    metadata: {
                        ...metadata,
                        creditsUsed: (typeof metadata?.creditsUsed === 'number' ? metadata.creditsUsed : 0) + delta,
                    },
                }),
            });
            return typeof thread?.metadata?.creditsUsed === 'number'
                ? thread.metadata.creditsUsed
                : undefined;
        }
        catch (error) {
            this.logger.warn('Failed to persist Instance AI thread credit total', {
                error: (0, get_error_message_1.getErrorMessage)(error),
                threadId,
            });
            return undefined;
        }
    }
    rememberClaimedRunId(dedupeId) {
        this.claimedRunIds.add(dedupeId);
        if (this.claimedRunIds.size > InstanceAiCreditService_1.CLAIM_DEDUPE_CACHE_SIZE) {
            const oldest = this.claimedRunIds.values().next().value;
            if (oldest !== undefined)
                this.claimedRunIds.delete(oldest);
        }
    }
};
exports.InstanceAiCreditService = InstanceAiCreditService;
InstanceAiCreditService.CLAIM_DEDUPE_CACHE_SIZE = 1000;
InstanceAiCreditService.CLAIM_MAX_ATTEMPTS = 3;
exports.InstanceAiCreditService = InstanceAiCreditService = InstanceAiCreditService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, ai_service_1.AiService, telemetry_1.Telemetry, n8n_core_1.InstanceSettings, push_1.Push, instance_ai_thread_repository_1.InstanceAiThreadRepository])
], InstanceAiCreditService);
//# sourceMappingURL=instance-ai-credit.service.js.map
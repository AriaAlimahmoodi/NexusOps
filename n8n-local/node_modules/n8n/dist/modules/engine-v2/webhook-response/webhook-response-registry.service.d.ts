import { Logger } from '@n8n/backend-common';
import { EngineConfig } from '@n8n/config';
import type { ResponseExpectation } from '@n8n/engine';
import type { ExecutionIdV2 } from '../../../executions/execution-id';
import type { ResponseStream } from '../../../webhooks/streaming-webhook-response-heartbeat';
import type { ExecutionResponseReceiver } from '../response-channel/execution-response-receiver';
import { type WebhookRunOutcome } from './webhook-outcome';
export interface WebhookResponseWait {
    readonly executionId: ExecutionIdV2;
    readonly outcome: Promise<WebhookRunOutcome>;
    release(): void;
}
export declare const MAX_PENDING_WEBHOOKS = 5000;
export declare const SUBSCRIBE_TIMEOUT_MS = 30000;
export declare class EngineV2WebhookResponseRegistry {
    private readonly engineConfig;
    private readonly logger;
    private receiver?;
    private readonly pendingWebhooks;
    constructor(engineConfig: EngineConfig, logger: Logger);
    useReceiver(receiver: ExecutionResponseReceiver): void;
    waitForResponse(executionId: ExecutionIdV2, expectation: ResponseExpectation, responseStream?: ResponseStream): Promise<WebhookResponseWait>;
    private subscribe;
    private handle;
    private settle;
    private release;
}

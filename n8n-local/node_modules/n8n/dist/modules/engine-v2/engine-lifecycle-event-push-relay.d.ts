import { Logger } from '@n8n/backend-common';
import type { LifecycleEvent } from '@n8n/engine';
import { Push } from '../../push';
import { EngineV2PushRegistry } from '../../services/engine-v2-push-registry.service';
export declare class EngineLifecycleEventPushRelay {
    private readonly registry;
    private readonly push;
    private readonly logger;
    constructor(registry: EngineV2PushRegistry, push: Push, logger: Logger);
    relay(events: LifecycleEvent[]): void;
    private relayOne;
    private onExecutionStarted;
    private onStepStarted;
    private onStepSettled;
    private onExecutionFinished;
    private sendNodeExecuteBefore;
    private sendNodeExecuteAfter;
}

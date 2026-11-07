import { EngineV2PushSession } from '../services/engine-v2-push-session';
export declare class EngineV2PushRegistry {
    private readonly sessions;
    register(executionId: string, init: Pick<EngineV2PushSession, 'pushRef' | 'workflowId' | 'trigger'>): void;
    get(executionId: string): EngineV2PushSession | undefined;
    release(executionId: string): void;
    private evict;
}

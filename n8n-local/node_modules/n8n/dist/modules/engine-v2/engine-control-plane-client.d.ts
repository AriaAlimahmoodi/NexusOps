import type { LifecycleEvent } from '@n8n/engine';
import { EngineControlPlaneTransport } from './engine-control-plane-transport';
export declare class EngineControlPlaneClient {
    private readonly http;
    constructor(transport: EngineControlPlaneTransport);
    sendLifecycleEvents(events: LifecycleEvent[], signal: AbortSignal): Promise<void>;
}

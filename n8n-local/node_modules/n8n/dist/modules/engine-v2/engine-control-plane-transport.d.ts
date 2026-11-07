import type { HttpRequestClient } from '@n8n/backend-network';
import { OutboundHttp } from '@n8n/backend-network';
import { EngineConfig } from '@n8n/config';
import type { ActionScope } from '@n8n/engine';
export declare class EngineControlPlaneTransport {
    private readonly engineConfig;
    private readonly outboundHttp;
    constructor(engineConfig: EngineConfig, outboundHttp: OutboundHttp);
    forScope(scope: ActionScope): HttpRequestClient;
}

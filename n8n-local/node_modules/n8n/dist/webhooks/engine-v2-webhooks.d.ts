import type { INode, IRun, IWorkflowBase, WebhookResponseMode, WorkflowExecuteMode } from 'n8n-workflow';
import { EngineDataPlaneProxyService } from '../services/engine-data-plane-proxy.service';
import { EngineV2Dispatcher } from '../services/engine-v2-dispatcher.service';
import type { WebhookRunOutcome } from '../modules/engine-v2/webhook-response/webhook-outcome';
export type EngineV2WebhookRequest = {
    workflowStartNode: INode;
    responseMode: WebhookResponseMode;
    executionId: string | undefined;
};
export declare class EngineV2Webhooks {
    private readonly dispatcher;
    private readonly proxy;
    constructor(dispatcher: EngineV2Dispatcher, proxy: EngineDataPlaneProxyService);
    handles(workflowData: IWorkflowBase, executionMode: WorkflowExecuteMode): boolean;
    assertSupported({ workflowStartNode, responseMode, executionId }: EngineV2WebhookRequest): void;
    private keepsRawBody;
    toRun(outcome: Exclude<WebhookRunOutcome, {
        status: 'response' | 'timeout' | 'undeliverable' | 'cancelled';
    }>, executionMode: WorkflowExecuteMode): Promise<IRun>;
}

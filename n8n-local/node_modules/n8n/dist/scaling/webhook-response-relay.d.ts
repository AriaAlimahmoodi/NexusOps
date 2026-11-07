import { Logger } from '@n8n/backend-common';
import { ExecutionsConfig } from '@n8n/config';
import { BinaryDataConfig, BinaryDataService } from 'n8n-core';
import type { IExecuteResponsePromiseData } from 'n8n-workflow';
export declare const OFFLOADED_BODY_KIND_KEY = "__@N8nOffloadedBodyKind@__";
export type RelayContext = {
    workflowId: string;
    executionId: string;
};
export type RelayReadContext = Partial<RelayContext>;
export declare class WebhookResponseRelay {
    private readonly logger;
    private readonly binaryDataService;
    private readonly binaryDataConfig;
    private readonly executionsConfig;
    constructor(logger: Logger, binaryDataService: BinaryDataService, binaryDataConfig: BinaryDataConfig, executionsConfig: ExecutionsConfig);
    prepare(response: IExecuteResponsePromiseData, context: RelayContext): Promise<IExecuteResponsePromiseData>;
    restoreOffloadedBody<T>(response: T, { reclaim, context }: {
        reclaim: boolean;
        context: RelayReadContext;
    }): Promise<T>;
    deleteOffloadedBody(response: IExecuteResponsePromiseData, context: RelayReadContext): Promise<void>;
    assertFitsInline(payload: unknown): void;
    private assertOffloadAvailable;
    private get maxInlineMib();
    private get maxInlineBytes();
    private exceedsInline;
    private offload;
    private storeBody;
    private degradeToEmptyBody;
    private deleteStoredBody;
}

import type { IDeferredPromise } from '@n8n/utils/promise/deferred-promise';
import type { IExecuteResponsePromiseData, INodeExecutionData, IRun, IWorkflowBase, WorkflowExecuteMode } from 'n8n-workflow';
import { EngineV2Dispatcher } from '../../services/engine-v2-dispatcher.service';
import { EngineV2PayloadFiles } from '../../services/engine-v2-payload-files.service';
export type EngineV2ActiveTriggerEmit = {
    responsePromise?: IDeferredPromise<IExecuteResponsePromiseData>;
    donePromise?: IDeferredPromise<IRun | undefined>;
};
export declare class EngineV2ActiveTriggers {
    private readonly dispatcher;
    private readonly payloadFiles;
    constructor(dispatcher: EngineV2Dispatcher, payloadFiles: EngineV2PayloadFiles);
    handles(workflowData: IWorkflowBase, mode: WorkflowExecuteMode): boolean;
    assertSupported({ responsePromise, donePromise }: EngineV2ActiveTriggerEmit, slots: Array<INodeExecutionData[] | null>): void;
}

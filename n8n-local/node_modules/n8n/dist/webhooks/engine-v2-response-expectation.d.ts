import type { ResponseExpectation } from '@n8n/engine';
import type { IWorkflowExecutionDataProcess } from 'n8n-workflow';
type EngineV2ResponseMode = NonNullable<IWorkflowExecutionDataProcess['engineV2Response']>['responseMode'];
export declare function toResponseExpectation(responseMode?: EngineV2ResponseMode): ResponseExpectation;
export {};

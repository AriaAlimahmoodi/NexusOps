import type { INodeTypeDescription } from 'n8n-workflow';
import type { SimpleWorkflow } from '../../types';
import type { ProgrammaticViolation, SingleEvaluatorResult } from '../types';
export interface TriggerEvaluationResult extends SingleEvaluatorResult {
    hasTrigger: boolean;
    triggerNodes: string[];
}
export declare function validateTrigger(workflow: SimpleWorkflow, nodeTypes: INodeTypeDescription[]): ProgrammaticViolation[];

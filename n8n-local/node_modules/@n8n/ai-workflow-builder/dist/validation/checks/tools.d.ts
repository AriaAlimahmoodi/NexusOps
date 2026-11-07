import type { INodeTypeDescription } from 'n8n-workflow';
import type { SimpleWorkflow } from '../../types';
import type { SingleEvaluatorResult } from '../types';
export declare function validateTools(workflow: SimpleWorkflow, nodeTypes: INodeTypeDescription[]): SingleEvaluatorResult['violations'];

import type { INodeTypeDescription } from 'n8n-workflow';
import type { ProgrammaticChecksResult, ProgrammaticEvaluationInput } from './types';
export declare function programmaticValidation(input: ProgrammaticEvaluationInput, nodeTypes: INodeTypeDescription[]): ProgrammaticChecksResult;

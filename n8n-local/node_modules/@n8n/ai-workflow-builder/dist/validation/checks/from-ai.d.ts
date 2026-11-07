import type { INodeTypeDescription } from 'n8n-workflow';
import type { SimpleWorkflow } from '../../types';
import type { ProgrammaticViolation } from '../types';
export declare function validateFromAi(workflow: SimpleWorkflow, nodeTypes: INodeTypeDescription[]): ProgrammaticViolation[];

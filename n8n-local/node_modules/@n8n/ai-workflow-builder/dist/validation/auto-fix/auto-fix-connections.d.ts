import type { INodeTypeDescription, NodeConnectionType, IConnections } from 'n8n-workflow';
import type { SimpleWorkflow } from '../../types';
import type { ProgrammaticViolation } from '../types';
export interface AutoFixResult {
    fixed: AutoFixedConnection[];
    unfixable: UnfixableConnection[];
    updatedConnections: IConnections;
}
export interface AutoFixedConnection {
    sourceNodeName: string;
    targetNodeName: string;
    connectionType: NodeConnectionType;
    reason: string;
}
export interface UnfixableConnection {
    nodeName: string;
    missingInputType: NodeConnectionType;
    reason: string;
    candidateCount: number;
}
export declare function autoFixConnections(workflow: SimpleWorkflow, nodeTypes: INodeTypeDescription[], violations: ProgrammaticViolation[]): AutoFixResult;

import type { IConnections, INode } from 'n8n-workflow';
import { BadRequestError } from '@n8n/errors';
export declare class WorkflowMigrationNodeError extends BadRequestError {
    readonly meta: {
        nodeId: string;
        nodeName: string;
    };
    constructor(message: string, meta: {
        nodeId: string;
        nodeName: string;
    });
}
export interface NodeMigrationResult {
    node: Pick<INode, 'type' | 'typeVersion' | 'parameters'>;
    unmapped?: string[];
    notes?: string[];
}
export interface NodeMigration {
    ruleId: string;
    migrate(node: INode): NodeMigrationResult;
}
export interface WorkflowMigrationInput {
    nodes: INode[];
    connections: IConnections;
    affectedNodeIds: Set<string>;
}
export interface WorkflowMigrationOutput {
    nodes: INode[];
    connections: IConnections;
    migratedNodeIds: string[];
    unmapped?: string[];
    notes?: string[];
}
export interface WorkflowMigration {
    ruleId: string;
    migrateWorkflow(input: WorkflowMigrationInput): WorkflowMigrationOutput;
}
export declare function replaceAffectedNodes(nodes: INode[], affectedNodeIds: Set<string>, migrateNode: (node: INode) => INode): Pick<WorkflowMigrationOutput, 'nodes' | 'migratedNodeIds'>;
export type Migration = NodeMigration | WorkflowMigration;
export declare const isWorkflowMigration: (migration: Migration) => migration is WorkflowMigration;

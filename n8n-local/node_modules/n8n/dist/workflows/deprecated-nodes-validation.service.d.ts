import { Logger } from '@n8n/backend-common';
import { NodesConfig } from '@n8n/config';
import type { INode } from 'n8n-workflow';
import { NodeTypes } from '../node-types';
export declare class DeprecatedNodesValidationService {
    private readonly logger;
    private readonly nodesConfig;
    private readonly nodeTypes;
    constructor(logger: Logger, nodesConfig: NodesConfig, nodeTypes: NodeTypes);
    validateOnCreate(nodes: INode[], workflowId?: string): void;
    validateOnUpdate(incomingNodes: INode[], existingNodes: INode[], workflowId?: string): void;
    private frozenFields;
    private throwIfViolations;
    private deprecatedDescription;
    private formatMessage;
}
